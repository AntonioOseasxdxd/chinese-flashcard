// src/utils/migrationUtils.js
import { OfflineStorage } from '../services/offlineStorage';
import { FirebaseSync } from '../services/firebaseSync';

export const MigrationUtils = {
  // Verificar si necesita migración
  async needsMigration() {
    try {
      const cards = await OfflineStorage.getCards();
      const decks = await OfflineStorage.getDecks();
      
      // Si hay cartas sin deckId o no hay mazos, necesita migración
      const cardsNeedMigration = cards.some(card => !card.deckId);
      const noDecks = decks.length === 0;
      
      return cardsNeedMigration || noDecks;
    } catch (error) {
      console.error('Error checking migration needs:', error);
      return false;
    }
  },

  // Ejecutar migración completa
  async runMigration() {
    try {
      console.log('🔄 Iniciando migración al sistema de mazos...');
      
      // Paso 1: Cargar datos existentes
      const [cards, progress, settings] = await Promise.all([
        OfflineStorage.getCards(),
        OfflineStorage.getProgress(),
        OfflineStorage.getSettings()
      ]);

      console.log(`📊 Encontrados: ${cards.length} cartas, ${Object.keys(progress).length} registros de progreso`);

      // Paso 2: Crear mazo por defecto si no existe
      let decks = await OfflineStorage.getDecks();
      let defaultDeck = decks.find(deck => deck.id === 'default');
      
      if (!defaultDeck) {
        defaultDeck = {
          id: 'default',
          name: '📚 Mazo Principal',
          description: 'Mazo creado automáticamente durante la migración',
          color: '#007bff',
          icon: '📚',
          createdAt: new Date().toISOString(),
          cardCount: 0
        };
        decks = [...decks, defaultDeck];
        console.log('✅ Mazo por defecto creado');
      }

      // Paso 3: Migrar cartas al sistema de mazos
      const migratedCards = cards.map(card => {
        if (card.deckId) {
          // Ya tiene deckId, solo verificar que el mazo existe
          const deck = decks.find(d => d.id === card.deckId);
          return {
            ...card,
            deckId: deck ? card.deckId : 'default',
            deckName: deck ? card.deckName || deck.name : '📚 Mazo Principal'
          };
        } else {
          // Asignar al mazo por defecto
          return {
            ...card,
            deckId: 'default',
            deckName: '📚 Mazo Principal'
          };
        }
      });

      // Paso 4: Actualizar conteo de cartas en mazos
      const updatedDecks = decks.map(deck => ({
        ...deck,
        cardCount: migratedCards.filter(card => card.deckId === deck.id).length
      }));

      // Paso 5: Guardar datos migrados
      await Promise.all([
        OfflineStorage.saveDecks(updatedDecks),
        OfflineStorage.saveCards(migratedCards),
        OfflineStorage.saveCurrentDeck(defaultDeck)
      ]);

      // Paso 6: Sincronizar con Firebase si está disponible
      if (navigator.onLine) {
        try {
          await FirebaseSync.syncDecks(updatedDecks);
          await FirebaseSync.syncCards(migratedCards);
          console.log('☁️ Datos sincronizados con Firebase');
        } catch (error) {
          console.warn('⚠️ Error sincronizando con Firebase (continuando con datos locales):', error.message);
        }
      }

      console.log(`✅ Migración completada: ${migratedCards.length} cartas en ${updatedDecks.length} mazos`);
      
      return {
        success: true,
        migratedCards: migratedCards.length,
        totalDecks: updatedDecks.length,
        defaultDeckCards: migratedCards.filter(card => card.deckId === 'default').length
      };
    } catch (error) {
      console.error('❌ Error durante la migración:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Migración automática basada en categorías
  async migrateByCategories() {
    try {
      const cards = await OfflineStorage.getCards();
      const existingDecks = await OfflineStorage.getDecks();
      
      // Agrupar cartas por categoría
      const categoriesMap = {};
      cards.forEach(card => {
        const category = card.category || 'general';
        if (!categoriesMap[category]) {
          categoriesMap[category] = [];
        }
        categoriesMap[category].push(card);
      });

      const categories = Object.keys(categoriesMap);
      console.log(`📋 Categorías encontradas: ${categories.join(', ')}`);

      // Crear mazos basados en categorías
      const newDecks = [...existingDecks];
      const deckColors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1', '#fd7e14', '#20c997', '#e83e8c'];
      const deckIcons = ['📚', '🎯', '🧠', '💡', '🚀', '⭐', '🔥', '💪'];

      categories.forEach((category, index) => {
        const deckId = `deck_${category.toLowerCase().replace(/\s+/g, '_')}`;
        
        // Verificar si el mazo ya existe
        if (!newDecks.find(deck => deck.id === deckId)) {
          const newDeck = {
            id: deckId,
            name: `${deckIcons[index % deckIcons.length]} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
            description: `Mazo creado automáticamente para la categoría: ${category}`,
            color: deckColors[index % deckColors.length],
            icon: deckIcons[index % deckIcons.length],
            createdAt: new Date().toISOString(),
            cardCount: categoriesMap[category].length
          };
          newDecks.push(newDeck);
        }
      });

      // Asignar cartas a sus mazos correspondientes
      const migratedCards = cards.map(card => {
        const category = card.category || 'general';
        const deckId = `deck_${category.toLowerCase().replace(/\s+/g, '_')}`;
        const deck = newDecks.find(d => d.id === deckId);
        
        return {
          ...card,
          deckId: deck ? deckId : 'default',
          deckName: deck ? deck.name : '📚 Mazo Principal'
        };
      });

      // Guardar cambios
      await Promise.all([
        OfflineStorage.saveDecks(newDecks),
        OfflineStorage.saveCards(migratedCards),
        OfflineStorage.saveCurrentDeck(newDecks[0])
      ]);

      return {
        success: true,
        createdDecks: newDecks.length - existingDecks.length,
        totalDecks: newDecks.length,
        migratedCards: migratedCards.length
      };
    } catch (error) {
      console.error('Error en migración por categorías:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Verificar integridad de datos después de migración
  async verifyMigration() {
    try {
      const [decks, cards, progress] = await Promise.all([
        OfflineStorage.getDecks(),
        OfflineStorage.getCards(),
        OfflineStorage.getProgress()
      ]);

      const issues = [];

      // Verificar que todas las cartas tienen deckId
      const cardsWithoutDeck = cards.filter(card => !card.deckId);
      if (cardsWithoutDeck.length > 0) {
        issues.push(`${cardsWithoutDeck.length} cartas sin deckId`);
      }

      // Verificar que todos los deckId de las cartas existen en los mazos
      const deckIds = new Set(decks.map(deck => deck.id));
      const orphanCards = cards.filter(card => !deckIds.has(card.deckId));
      if (orphanCards.length > 0) {
        issues.push(`${orphanCards.length} cartas con deckId inválido`);
      }

      // Verificar conteos de cartas en mazos
      const deckCardCounts = {};
      cards.forEach(card => {
        deckCardCounts[card.deckId] = (deckCardCounts[card.deckId] || 0) + 1;
      });

      decks.forEach(deck => {
        const actualCount = deckCardCounts[deck.id] || 0;
        if (deck.cardCount !== actualCount) {
          issues.push(`Mazo "${deck.name}": conteo incorrecto (${deck.cardCount} vs ${actualCount})`);
        }
      });

      return {
        valid: issues.length === 0,
        issues,
        stats: {
          totalDecks: decks.length,
          totalCards: cards.length,
          totalProgress: Object.keys(progress).length,
          cardsWithDeck: cards.filter(card => card.deckId).length
        }
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  },

  // Reparar problemas encontrados
  async repairData() {
    try {
      const [decks, cards] = await Promise.all([
        OfflineStorage.getDecks(),
        OfflineStorage.getCards()
      ]);

      let needsRepair = false;

      // Reparar cartas sin deckId
      const repairedCards = cards.map(card => {
        if (!card.deckId) {
          needsRepair = true;
          return {
            ...card,
            deckId: 'default',
            deckName: '📚 Mazo Principal'
          };
        }
        return card;
      });

      // Crear mazo por defecto si no existe
      let repairedDecks = [...decks];
      if (!decks.find(deck => deck.id === 'default')) {
        const defaultDeck = {
          id: 'default',
          name: '📚 Mazo Principal',
          description: 'Mazo por defecto creado durante reparación',
          color: '#007bff',
          icon: '📚',
          createdAt: new Date().toISOString(),
          cardCount: 0
        };
        repairedDecks.push(defaultDeck);
        needsRepair = true;
      }

      // Actualizar conteos de cartas
      const updatedDecks = repairedDecks.map(deck => {
        const cardCount = repairedCards.filter(card => card.deckId === deck.id).length;
        if (deck.cardCount !== cardCount) {
          needsRepair = true;
          return { ...deck, cardCount };
        }
        return deck;
      });

      if (needsRepair) {
        await Promise.all([
          OfflineStorage.saveDecks(updatedDecks),
          OfflineStorage.saveCards(repairedCards)
        ]);
        
        console.log('🔧 Datos reparados exitosamente');
      }

      return {
        success: true,
        repaired: needsRepair,
        stats: {
          decks: updatedDecks.length,
          cards: repairedCards.length
        }
      };
    } catch (error) {
      console.error('Error reparando datos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default MigrationUtils;