// src/services/firebaseSync.js - IMPLEMENTACIÓN REAL CON FIRESTORE
import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { OfflineStorage } from './offlineStorage';

// Generar ID único para usuarios anónimos
const generateUserId = () => {
  const stored = localStorage.getItem('chinese_flashcards_user_id');
  if (stored) return stored;
  
  const newId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('chinese_flashcards_user_id', newId);
  return newId;
};

export const FirebaseSync = {
  currentUser: null,
  isInitialized: false,

  // Inicializar usuario
  async initializeUser(userId = null) {
    try {
      this.currentUser = userId || generateUserId();
      this.isInitialized = true;
      
      console.log('🔥 Firebase initialized for user:', this.currentUser);
      
      // Verificar si es la primera vez y migrar datos si es necesario
      await this.migrateToDecksSystem();
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing Firebase user:', error);
      return false;
    }
  },

  // Verificar conectividad
  async isOnline() {
    try {
      // Intentar leer un documento pequeño de prueba
      const testDoc = doc(db, 'chinese_flashcards', this.currentUser || 'test');
      await getDoc(testDoc);
      return true;
    } catch (error) {
      console.log('📡 Offline mode - Firebase not reachable');
      return false;
    }
  },

  // GESTIÓN DE MAZOS
  async getDecks() {
    try {
      if (!this.isInitialized) await this.initializeUser();
      
      console.log('📚 Getting decks from Firebase...');
      const userDoc = doc(db, 'chinese_flashcards', this.currentUser);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const decks = data.decks || [];
        console.log(`✅ Got ${decks.length} decks from Firebase`);
        
        // Guardar en cache local
        await OfflineStorage.saveDecks(decks);
        return decks;
      } else {
        console.log('📂 No decks found in Firebase, checking local...');
        const localDecks = await OfflineStorage.getDecks();
        
        if (localDecks.length > 0) {
          console.log(`📤 Uploading ${localDecks.length} local decks to Firebase...`);
          await this.syncDecks(localDecks);
        }
        
        return localDecks;
      }
    } catch (error) {
      console.error('❌ Error getting decks from Firebase:', error);
      // Fallback a datos locales
      return await OfflineStorage.getDecks();
    }
  },

  async syncDecks(decks) {
    try {
      if (!this.isInitialized) await this.initializeUser();
      
      console.log(`📤 Syncing ${decks.length} decks to Firebase...`);
      
      const userDoc = doc(db, 'chinese_flashcards', this.currentUser);
      const docSnap = await getDoc(userDoc);
      
      const currentData = docSnap.exists() ? docSnap.data() : {};
      
      await setDoc(userDoc, {
        ...currentData,
        decks: decks,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      
      // Guardar también localmente
      await OfflineStorage.saveDecks(decks);
      
      console.log('✅ Decks synced successfully');
      return true;
    } catch (error) {
      console.error('❌ Error syncing decks:', error);
      // Guardar localmente aunque falle Firebase
      await OfflineStorage.saveDecks(decks);
      return false;
    }
  },

  // GESTIÓN DE CARTAS
  async getCards() {
    try {
      if (!this.isInitialized) await this.initializeUser();
      
      console.log('🃏 Getting cards from Firebase...');
      const userDoc = doc(db, 'chinese_flashcards', this.currentUser);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        let cards = data.cards || [];
        
        // Asegurar que todas las cartas tienen deckId
        cards = cards.map(card => ({
          ...card,
          deckId: card.deckId || 'default',
          deckName: card.deckName || '📚 Mazo Principal'
        }));
        
        console.log(`✅ Got ${cards.length} cards from Firebase`);
        
        // Guardar en cache local
        await OfflineStorage.saveCards(cards);
        return cards;
      } else {
        console.log('📂 No cards found in Firebase, checking local...');
        const localCards = await OfflineStorage.getCards();
        
        if (localCards.length > 0) {
          console.log(`📤 Uploading ${localCards.length} local cards to Firebase...`);
          await this.syncCards(localCards);
        }
        
        return localCards;
      }
    } catch (error) {
      console.error('❌ Error getting cards from Firebase:', error);
      return await OfflineStorage.getCards();
    }
  },

  async syncCards(cards) {
    try {
      if (!this.isInitialized) await this.initializeUser();
      
      console.log(`📤 Syncing ${cards.length} cards to Firebase...`);
      
      // Asegurar que todas las cartas tienen deckId
      const cardsWithDeckId = cards.map(card => ({
        ...card,
        deckId: card.deckId || 'default',
        deckName: card.deckName || '📚 Mazo Principal'
      }));
      
      const userDoc = doc(db, 'chinese_flashcards', this.currentUser);
      const docSnap = await getDoc(userDoc);
      
      const currentData = docSnap.exists() ? docSnap.data() : {};
      
      await setDoc(userDoc, {
        ...currentData,
        cards: cardsWithDeckId,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      
      // Guardar también localmente
      await OfflineStorage.saveCards(cardsWithDeckId);
      
      console.log('✅ Cards synced successfully');
      return true;
    } catch (error) {
      console.error('❌ Error syncing cards:', error);
      await OfflineStorage.saveCards(cards);
      return false;
    }
  },

  // GESTIÓN DE PROGRESO
  async getProgress() {
    try {
      if (!this.isInitialized) await this.initializeUser();
      
      console.log('📊 Getting progress from Firebase...');
      const userDoc = doc(db, 'chinese_flashcards', this.currentUser);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const progress = data.progress || {};
        
        console.log(`✅ Got progress for ${Object.keys(progress).length} cards from Firebase`);
        
        // Guardar en cache local
        await OfflineStorage.saveProgress(progress);
        return progress;
      } else {
        console.log('📂 No progress found in Firebase, checking local...');
        const localProgress = await OfflineStorage.getProgress();
        
        if (Object.keys(localProgress).length > 0) {
          console.log(`📤 Uploading local progress to Firebase...`);
          await this.syncProgress(localProgress);
        }
        
        return localProgress;
      }
    } catch (error) {
      console.error('❌ Error getting progress from Firebase:', error);
      return await OfflineStorage.getProgress();
    }
  },

  async syncProgress(progress) {
    try {
      if (!this.isInitialized) await this.initializeUser();
      
      console.log(`📤 Syncing progress for ${Object.keys(progress).length} cards...`);
      
      const userDoc = doc(db, 'chinese_flashcards', this.currentUser);
      const docSnap = await getDoc(userDoc);
      
      const currentData = docSnap.exists() ? docSnap.data() : {};
      
      await setDoc(userDoc, {
        ...currentData,
        progress: progress,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      
      // Guardar también localmente
      await OfflineStorage.saveProgress(progress);
      
      console.log('✅ Progress synced successfully');
      return true;
    } catch (error) {
      console.error('❌ Error syncing progress:', error);
      await OfflineStorage.saveProgress(progress);
      return false;
    }
  },

  // SINCRONIZACIÓN COMPLETA
  async forceSync() {
    try {
      if (!this.isInitialized) await this.initializeUser();
      
      console.log('🔄 Starting full sync...');
      
      // Verificar conectividad
      const online = await this.isOnline();
      if (!online) {
        console.log('📱 Device offline, using local data');
        const localDecks = await OfflineStorage.getDecks();
        const localCards = await OfflineStorage.getCards();
        const localProgress = await OfflineStorage.getProgress();
        
        return {
          success: false,
          decks: localDecks,
          cards: localCards,
          progress: localProgress,
          error: 'Device offline'
        };
      }
      
      // Obtener datos de Firebase y locales
      const userDoc = doc(db, 'chinese_flashcards', this.currentUser);
      const docSnap = await getDoc(userDoc);
      
      let firebaseData = {};
      if (docSnap.exists()) {
        firebaseData = docSnap.data();
      }
      
      const [localDecks, localCards, localProgress] = await Promise.all([
        OfflineStorage.getDecks(),
        OfflineStorage.getCards(),
        OfflineStorage.getProgress()
      ]);
      
      // Mergear datos (priorizar Firebase si existe)
      const mergedDecks = this.mergeDecks(firebaseData.decks || [], localDecks);
      const mergedCards = this.mergeCards(firebaseData.cards || [], localCards);
      const mergedProgress = this.mergeProgress(firebaseData.progress || {}, localProgress);
      
      // Sincronizar datos merged
      await Promise.all([
        this.syncDecks(mergedDecks),
        this.syncCards(mergedCards),
        this.syncProgress(mergedProgress)
      ]);
      
      console.log('✅ Full sync completed successfully');
      
      return {
        success: true,
        decks: mergedDecks,
        cards: mergedCards,
        progress: mergedProgress
      };
    } catch (error) {
      console.error('❌ Error during full sync:', error);
      
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

  // FUNCIONES DE MERGE
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

  // MIGRACIÓN Y UTILIDADES
  async migrateToDecksSystem() {
    try {
      // Verificar si ya hay mazos
      const decks = await OfflineStorage.getDecks();
      if (decks.length > 0) {
        console.log('✅ Decks system already migrated');
        return true;
      }
      
      // Verificar si hay cartas que necesitan migración
      const cards = await OfflineStorage.getCards();
      const cardsNeedingMigration = cards.filter(card => !card.deckId);
      
      if (cardsNeedingMigration.length === 0) {
        console.log('✅ No cards need migration');
        return true;
      }
      
      console.log(`🔄 Migrating ${cardsNeedingMigration.length} cards to deck system...`);
      
      // Crear mazo por defecto
      const defaultDeck = {
        id: 'default',
        name: '📚 Mazo Principal',
        description: 'Mazo creado automáticamente durante la migración',
        color: '#007bff',
        icon: '📚',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cardCount: cardsNeedingMigration.length
      };
      
      // Migrar cartas
      const migratedCards = cards.map(card => ({
        ...card,
        deckId: card.deckId || 'default',
        deckName: card.deckName || '📚 Mazo Principal'
      }));
      
      // Guardar localmente primero
      await OfflineStorage.saveDecks([defaultDeck]);
      await OfflineStorage.saveCards(migratedCards);
      
      // Sincronizar con Firebase si está online
      if (await this.isOnline()) {
        await this.syncDecks([defaultDeck]);
        await this.syncCards(migratedCards);
      }
      
      console.log(`✅ Migration completed successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error during migration:', error);
      return false;
    }
  },

  // Limpiar datos del usuario
  async clearUserData() {
    try {
      if (!this.isInitialized) return false;
      
      console.log('🗑️ Clearing user data from Firebase...');
      
      const userDoc = doc(db, 'chinese_flashcards', this.currentUser);
      await setDoc(userDoc, {
        decks: [],
        cards: [],
        progress: {},
        lastUpdated: serverTimestamp()
      });
      
      console.log('✅ Firebase user data cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing Firebase data:', error);
      return false;
    }
  },

  // Obtener información del usuario
  async getUserInfo() {
    try {
      if (!this.isInitialized) await this.initializeUser();
      
      const userDoc = doc(db, 'chinese_flashcards', this.currentUser);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          userId: this.currentUser,
          decksCount: (data.decks || []).length,
          cardsCount: (data.cards || []).length,
          progressCount: Object.keys(data.progress || {}).length,
          lastUpdated: data.lastUpdated?.toDate?.() || null
        };
      }
      
      return {
        userId: this.currentUser,
        decksCount: 0,
        cardsCount: 0,
        progressCount: 0,
        lastUpdated: null
      };
    } catch (error) {
      console.error('❌ Error getting user info:', error);
      return null;
    }
  }
};

export default FirebaseSync;