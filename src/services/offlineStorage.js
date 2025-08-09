// src/services/offlineStorage.js

export class OfflineStorage {
  static STORAGE_KEYS = {
    CARDS: 'chineseCards',
    PROGRESS: 'userProgress',
    SETTINGS: 'appSettings',
    USER: 'currentUser'
  };

  // Guardar cartas
  static async saveCards(cards) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.CARDS, JSON.stringify(cards));
      return true;
    } catch (error) {
      console.error('Error saving cards:', error);
      return false;
    }
  }

  // Obtener cartas
  static async getCards() {
    try {
      const cardsJson = localStorage.getItem(this.STORAGE_KEYS.CARDS);
      return cardsJson ? JSON.parse(cardsJson) : null;
    } catch (error) {
      console.error('Error loading cards:', error);
      return null;
    }
  }

  // Guardar progreso del usuario
  static async saveProgress(progress) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
      return true;
    } catch (error) {
      console.error('Error saving progress:', error);
      return false;
    }
  }

  // Obtener progreso del usuario
  static async getProgress() {
    try {
      const progressJson = localStorage.getItem(this.STORAGE_KEYS.PROGRESS);
      return progressJson ? JSON.parse(progressJson) : {};
    } catch (error) {
      console.error('Error loading progress:', error);
      return {};
    }
  }

  // Guardar configuraciones
  static async saveSettings(settings) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  // Obtener configuraciones
  static async getSettings() {
    try {
      const settingsJson = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
      return settingsJson ? JSON.parse(settingsJson) : null;
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  }

  // Guardar usuario
  static async saveUser(user) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Error saving user:', error);
      return false;
    }
  }

  // Obtener usuario
  static async getUser() {
    try {
      const userJson = localStorage.getItem(this.STORAGE_KEYS.USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error loading user:', error);
      return null;
    }
  }

  // Limpiar todos los datos
  static async clearAll() {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  // Verificar si hay datos guardados
  static hasStoredData() {
    return localStorage.getItem(this.STORAGE_KEYS.CARDS) !== null;
  }
}

export default OfflineStorage;