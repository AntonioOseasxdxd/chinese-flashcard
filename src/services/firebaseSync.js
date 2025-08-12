// src/services/firebaseSync.js (ACTUALIZADO CON SOPORTE PARA MAZOS)
// NOTA: Este archivo necesitará ser adaptado según tu configuración específica de Firebase
// Aquí muestro la estructura y métodos necesarios para el soporte de mazos

import { OfflineStorage } from './offlineStorage';

// Simulación de Firebase - reemplazar con tu configuración real
class MockFirebase {
  constructor() {
    this.data = {
      users: {},
      decks: {},
      cards: {},
      progress: {}
    };
    this.currentUserId = 'anonymous_user';
  }

  async get(path) {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.data[path] || {};
  }

  async set(path, data) {
    await new Promise(resolve => setTimeout(resolve, 50));
    this.data[path] = data;
    return true;
  }

  async update(path, data) {
    await new Promise(resolve => setTimeout(resolve, 50));
    this.data[path] = { ...this.data[path], ...data };
    return true;
  }
}

const mockFirebase = new MockFirebase();

export const FirebaseSync = {
  currentUser: null,
  isInitialized: false,

  // Inicializar usuario
  async initializeUser(userId = null) {
    try {
      this.currentUser = userId || 'anonymous_user';
      this.isInitialized = true;
      
      // Migrar cartas existentes si es necesario
      await OfflineStorage.migrateCardsToDecks();
      
      console.log('Firebase initialized for user:', this.currentUser);
      return true;
    } catch (error) {
      console.error('Error initializing Firebase user:', error);
      return false;
    }
  },

  // NUEVO: Gestión de mazos en Firebase
  async getDecks() {
    try {
      if (!this.isInitialized) await this.initializeUser();
      
      const firebaseDecks = await mockFirebase.get(`users/${this.currentUser}/decks`);
      const decksArray = Object.values(firebaseDecks || {});
      
      // Si no hay mazos en Firebase, cargar desde almacenamiento local
      if (decksArray.length === 0) {
        const localDecks = await OfflineStorage.getDecks();
        if (localDecks.length > 0) {
          await this.syncDecks(localDecks);
          return localDecks;
        }
      }
      
      return decksArray;
    } catch (error) {
      console.error('Error getting decks from Firebase:', error);
      // Fallback a datos locales
      return await OfflineStorage.getDecks();
    }
  },

  async syncDecks(decks) {
    try {
      if (!this.isInitialized) await this.initializeUser();
      
      const decksObject = decks.reduce((acc, deck) => {
        acc[deck.id] = deck;
        return acc;
      }, {});
      
      await mockFirebase.set(`users/${this.currentUser}/decks`, decksObject);
      await OfflineStorage.saveDecks(decks);
      
      console.log('Decks synced successfully');
      return true;
    } catch (error) {
      console.error('Error syncing decks:', error);
      // Guardar localmente aunque falle Firebase
      await OfflineStorage.saveDecks(decks);
      return false;
    }
  },

  // Gestión de cartas (ACTUALIZADO para incluir deckId)
  async getCards() {
    try {
      if (!this.isInitialized) await this.initializeUser();
      
      const firebaseCards = await mockFirebase.get(`users/${this.currentUser}/cards`);
      const cardsArray = Object.values(firebaseCards || {});
      
      // Asegurar que todas las cartas tienen deckId
      const cardsWithDeckId = cardsArray.map(card => ({
        ...card,
        deckId: card.deckId || 'default',
        deckName: card.deckName || '📚 Mazo Principal'
      }));
      
      if (cardsWithDeckId.length === 0) {
        const localCards = await OfflineStorage.getCards();
        if (localCards.length > 0) {
          await this.syncCards(localCards);
          return localCards;
        }
      }
      
      return cardsWithDeckId;
    } catch (error) {
      console.error('Error getting cards from Firebase:', error);
      return await OfflineStorage.getCards();
    }
  },

  async syncCards(cards) {
    try {
      if (!this.isInitialized) await this.initializeUser();
      
      // Asegurar que todas las cartas tienen deckId
      const cardsWithDeckId = cards.map(card => ({
        ...card,
        deckId: card.deckId || 'default',
        deckName: card.deckName || '📚 Mazo Principal'
      }));
      
      const cardsObject = cardsWithDeckId.reduce((acc, card) => {
        acc[card.id] = card;
        return acc;
      }, {});
      
      await mockFirebase.set(`users/${this.currentUser}/cards`, cardsObject);
      await OfflineStorage.saveCards(cardsWithDeckId);
      
      console.log('Cards synced successfully');
      return true;
    } catch (error) {
      console.error('Error syncing cards:', error);
      await OfflineStorage.saveCards(cards);
      return false;
    }
  },

  // Gestión de progreso
  async getProgress() {
    try {
      if (!this.isInitialized) await this.initializeUser();
      
      const firebaseProgress = await mockFirebase.get(`users/${this.currentUser}/progress`);
      
      if (!firebaseProgress || Object.keys(firebaseProgress).length === 0) {
        const localProgress = await OfflineStorage.getProgress();
        if (Object.keys(localProgress).length > 0) {
          await this.syncProgress(localProgress);
          return localProgress;
        }
      }
      
      return firebaseProgress || {};
    } catch (error) {
      console.error('Error getting progress from Firebase:', error);
      return await OfflineStorage.getProgress();
    }
  },

  async syncProgress(progress) {
    try {
      if (!this.isInitialized) await this.initializeUser();
      
      await mockFirebase.set(`users/${this.currentUser}/progress`, progress);
      await OfflineStorage.saveProgress(progress);
      
      console.log('Progress synced successfully');
      return true;
    } catch (error) {
      console.error('Error syncing progress:', error);
      await OfflineStorage.saveProgress(progress);
      return false;
    }
  },

  // Sincronización completa (ACTUALIZADO para incluir mazos)
  async forcSync() {
    try {
      if (!this.isInitialized) await this.initializeUser();
      
      console.log('Starting full sync...');
      
      // Obtener datos de Firebase
      const [firebaseDecks, firebaseCards, firebaseProgress] = await Promise.all([
        this.getDecks(),
        this.getCards(),
        this.getProgress()
      ]);
      
      // Obtener datos locales
      const [localDecks, localCards, localProgress] = await Promise.all([
        OfflineStorage.getDecks(),
        OfflineStorage.getCards(),
        OfflineStorage.getProgress()
      ]);
      
      // Merger datos (priorizar los más recientes)
      const mergedDecks = this.mergeDecks(firebaseDecks, localDecks);
      const mergedCards = this.mergeCards(firebaseCards, localCards);
      const mergedProgress = this.mergeProgress(firebaseProgress, localProgress);
      
      // Sincronizar datos merged
      await Promise.all([
        this.syncDecks(mergedDecks),
        this.syncCards(mergedCards),
        this.syncProgress(mergedProgress)
      ]);
      
      console.log('Full sync completed successfully');
      
      return {
        success: true,
        decks: mergedDecks,
        cards: mergedCards,
        progress: mergedProgress
      };
    } catch (error) {
      console.error('Error during full sync:', error);
      
      // Retornar datos locales si falla la sincronización
      const localDecks = await OfflineStorage.getDecks();
      const localCards = await OfflineStorage.getCards();
      const localProgress = await OfflineStorage.getProgress();
      
      return {
        success: false,
        decks: localDecks,
        cards: localCards,
        progress: localProgress,
        error: error.message
      };
    }
  },

  // NUEVO: Función para mergear mazos
  mergeDecks(firebaseDecks, localDecks) {
    const merged = new Map();
    
    // Agregar mazos locales
    localDecks.forEach(deck => {
      merged.set(deck.id, deck);
    });
    
    // Agregar/actualizar con mazos de Firebase (más recientes tienen prioridad)
    firebaseDecks.forEach(deck => {
      const existing = merged.get(deck.id);
      if (!existing || new Date(deck.updatedAt || deck.createdAt) > new Date(existing.updatedAt || existing.createdAt)) {
        merged.set(deck.id, deck);
      }
    });
    
    return Array.from(merged.values());
  },

  // Función para mergear cartas (ACTUALIZADA para incluir deckId)
  mergeCards(firebaseCards, localCards) {
    const merged = new Map();
    
    // Agregar cartas locales
    localCards.forEach(card => {
      merged.set(card.id, {
        ...card,
        deckId: card.deckId || 'default',
        deckName: card.deckName || '📚 Mazo Principal'
      });
    });
    
    // Agregar/actualizar con cartas de Firebase
    firebaseCards.forEach(card => {
      const existing = merged.get(card.id);
      const cardWithDeck = {
        ...card,
        deckId: card.deckId || 'default',
        deckName: card.deckName || '📚 Mazo Principal'
      };
      
      if (!existing || new Date(card.updatedAt || card.createdAt) > new Date(existing.updatedAt || existing.createdAt)) {
        merged.set(card.id, cardWithDeck);
      }
    });
    
    return Array.from(merged.values());
  },

  // Función para mergear progreso
  mergeProgress(firebaseProgress, localProgress) {
    const merged = { ...localProgress };
    
    // Mergear progreso de Firebase
    Object.keys(firebaseProgress).forEach(cardId => {
      const firebaseCardProgress = firebaseProgress[cardId];
      const localCardProgress = merged[cardId];
      
      if (!localCardProgress || 
          new Date(firebaseCardProgress.lastUpdated) > new Date(localCardProgress.lastUpdated)) {
        merged[cardId] = firebaseCardProgress;
      }
    });
    
    return merged;
  },

  // Utilidades
  async isOnline() {
    try {
      // Intento simple de conectividad
      await mockFirebase.get('test');
      return true;
    } catch (error) {
      return false;
    }
  },

  async clearUserData() {
    try {
      if (!this.isInitialized) return false;
      
      await Promise.all([
        mockFirebase.set(`users/${this.currentUser}/decks`, {}),
        mockFirebase.set(`users/${this.currentUser}/cards`, {}),
        mockFirebase.set(`users/${this.currentUser}/progress`, {})
      ]);
      
      console.log('Firebase user data cleared');
      return true;
    } catch (error) {
      console.error('Error clearing Firebase data:', error);
      return false;
    }
  },

  // NUEVO: Migración de datos existentes
  async migrateToDecksSystem() {
    try {
      const cards = await this.getCards();
      const cardsNeedingMigration = cards.filter(card => !card.deckId);
      
      if (cardsNeedingMigration.length === 0) {
        console.log('No cards need migration');
        return true;
      }
      
      // Crear mazo por defecto si no existe
      const decks = await this.getDecks();
      let defaultDeck = decks.find(deck => deck.id === 'default');
      
      if (!defaultDeck) {
        defaultDeck = {
          id: 'default',
          name: '📚 Mazo Principal',
          description: 'Mazo creado automáticamente durante la migración',
          color: '#007bff',
          icon: '📚',
          createdAt: new Date().toISOString(),
          cardCount: cardsNeedingMigration.length
        };
        
        const updatedDecks = [...decks, defaultDeck];
        await this.syncDecks(updatedDecks);
      }
      
      // Migrar cartas
      const migratedCards = cards.map(card => ({
        ...card,
        deckId: card.deckId || 'default',
        deckName: card.deckName || '📚 Mazo Principal'
      }));
      
      await this.syncCards(migratedCards);
      
      console.log(`Migrated ${cardsNeedingMigration.length} cards to deck system`);
      return true;
    } catch (error) {
      console.error('Error during migration:', error);
      return false;
    }
  }
};

// Configuración para entorno real de Firebase
// Descomenta y configura según tu proyecto
/*
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  // Tu configuración de Firebase aquí
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Implementación real de Firebase aquí...
*/

export default FirebaseSync;