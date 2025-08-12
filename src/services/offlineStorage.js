// src/services/offlineStorage.js (ACTUALIZADO CON SOPORTE PARA MAZOS)
export const OfflineStorage = {
  // Claves de almacenamiento
  KEYS: {
    CARDS: 'chinese_flashcards_cards',
    PROGRESS: 'chinese_flashcards_progress',
    SETTINGS: 'chinese_flashcards_settings',
    USER_DATA: 'chinese_flashcards_user_data',
    DECKS: 'chinese_flashcards_decks',
    CURRENT_DECK: 'chinese_flashcards_current_deck'
  },

  // Gestión de cartas
  async getCards() {
    try {
      const cards = localStorage.getItem(this.KEYS.CARDS);
      return cards ? JSON.parse(cards) : [];
    } catch (error) {
      console.error('Error loading cards from localStorage:', error);
      return [];
    }
  },

  async saveCards(cards) {
    try {
      localStorage.setItem(this.KEYS.CARDS, JSON.stringify(cards));
      return true;
    } catch (error) {
      console.error('Error saving cards to localStorage:', error);
      return false;
    }
  },

  // Gestión de progreso
  async getProgress() {
    try {
      const progress = localStorage.getItem(this.KEYS.PROGRESS);
      return progress ? JSON.parse(progress) : {};
    } catch (error) {
      console.error('Error loading progress from localStorage:', error);
      return {};
    }
  },

  async saveProgress(progress) {
    try {
      localStorage.setItem(this.KEYS.PROGRESS, JSON.stringify(progress));
      return true;
    } catch (error) {
      console.error('Error saving progress to localStorage:', error);
      return false;
    }
  },

  // Gestión de configuraciones
  async getSettings() {
    try {
      const settings = localStorage.getItem(this.KEYS.SETTINGS);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
      return null;
    }
  },

  async saveSettings(settings) {
    try {
      localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
      return false;
    }
  },

  // NUEVO: Gestión de mazos
  async getDecks() {
    try {
      const decks = localStorage.getItem(this.KEYS.DECKS);
      return decks ? JSON.parse(decks) : [];
    } catch (error) {
      console.error('Error loading decks from localStorage:', error);
      return [];
    }
  },

  async saveDecks(decks) {
    try {
      localStorage.setItem(this.KEYS.DECKS, JSON.stringify(decks));
      return true;
    } catch (error) {
      console.error('Error saving decks to localStorage:', error);
      return false;
    }
  },

  // NUEVO: Gestión del mazo actual
  async getCurrentDeck() {
    try {
      const currentDeck = localStorage.getItem(this.KEYS.CURRENT_DECK);
      return currentDeck ? JSON.parse(currentDeck) : null;
    } catch (error) {
      console.error('Error loading current deck from localStorage:', error);
      return null;
    }
  },

  async saveCurrentDeck(deck) {
    try {
      localStorage.setItem(this.KEYS.CURRENT_DECK, JSON.stringify(deck));
      return true;
    } catch (error) {
      console.error('Error saving current deck to localStorage:', error);
      return false;
    }
  },

  // Gestión de datos de usuario
  async getUserData() {
    try {
      const userData = localStorage.getItem(this.KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error loading user data from localStorage:', error);
      return null;
    }
  },

  async saveUserData(userData) {
    try {
      localStorage.setItem(this.KEYS.USER_DATA, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Error saving user data to localStorage:', error);
      return false;
    }
  },

  // Limpiar todos los datos
  async clearAllData() {
    try {
      Object.values(this.KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },

  // NUEVO: Migrar cartas existentes al sistema de mazos
  async migrateCardsToDecks() {
    try {
      const cards = await this.getCards();
      const decks = await this.getDecks();
      
      // Si ya hay mazos o no hay cartas, no migrar
      if (decks.length > 0 || cards.length === 0) {
        return false;
      }

      // Crear mazo por defecto
      const defaultDeck = {
        id: 'default',
        name: '📚 Mazo Principal',
        description: 'Mazo predeterminado migrado automáticamente',
        color: '#007bff',
        icon: '📚',
        createdAt: new Date().toISOString(),
        cardCount: cards.length
      };

      // Asignar todas las cartas al mazo por defecto
      const migratedCards = cards.map(card => ({
        ...card,
        deckId: 'default',
        deckName: '📚 Mazo Principal'
      }));

      // Guardar mazos y cartas migradas
      await this.saveDecks([defaultDeck]);
      await this.saveCards(migratedCards);
      await this.saveCurrentDeck(defaultDeck);

      console.log(`Migrated ${cards.length} cards to default deck`);
      return true;
    } catch (error) {
      console.error('Error migrating cards to decks:', error);
      return false;
    }
  },

  // Obtener estadísticas de almacenamiento
  getStorageStats() {
    const stats = {};
    let totalSize = 0;

    Object.entries(this.KEYS).forEach(([name, key]) => {
      try {
        const data = localStorage.getItem(key);
        const size = data ? new Blob([data]).size : 0;
        stats[name] = {
          size,
          sizeKB: (size / 1024).toFixed(2),
          exists: !!data
        };
        totalSize += size;
      } catch (error) {
        stats[name] = { size: 0, sizeKB: '0.00', exists: false, error: error.message };
      }
    });

    stats.TOTAL = {
      size: totalSize,
      sizeKB: (totalSize / 1024).toFixed(2),
      sizeMB: (totalSize / (1024 * 1024)).toFixed(2)
    };

    return stats;
  }
};

export default OfflineStorage;