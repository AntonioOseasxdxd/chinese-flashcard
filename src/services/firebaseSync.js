// src/services/firebaseSync.js
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { OfflineStorage } from './offlineStorage';

export class FirebaseSync {
  static USER_ID = 'default_user'; // Para uso personal, puedes cambiarlo por un ID único
  static COLLECTION_NAME = 'chinese_flashcards';

  // Sincronizar cartas con Firebase
  static async syncCards(cards) {
    try {
      const userDocRef = doc(db, this.COLLECTION_NAME, this.USER_ID);
      
      await setDoc(userDocRef, {
        cards: cards,
        lastModified: serverTimestamp(),
        version: Date.now()
      }, { merge: true });

      // También guardar localmente como respaldo
      await OfflineStorage.saveCards(cards);
      
      console.log('Cards synced to Firebase successfully');
      return true;
    } catch (error) {
      console.error('Error syncing cards to Firebase:', error);
      // Si falla Firebase, al menos guardar localmente
      await OfflineStorage.saveCards(cards);
      return false;
    }
  }

  // Obtener cartas desde Firebase
  static async getCards() {
    try {
      const userDocRef = doc(db, this.COLLECTION_NAME, this.USER_ID);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Guardar localmente como cache
        if (data.cards) {
          await OfflineStorage.saveCards(data.cards);
        }
        
        return data.cards || [];
      } else {
        // Si no existe en Firebase, usar datos locales
        return await OfflineStorage.getCards() || [];
      }
    } catch (error) {
      console.error('Error getting cards from Firebase:', error);
      // Si falla Firebase, usar almacenamiento local
      return await OfflineStorage.getCards() || [];
    }
  }

  // Sincronizar progreso
  static async syncProgress(progress) {
    try {
      const userDocRef = doc(db, this.COLLECTION_NAME, this.USER_ID);
      
      await updateDoc(userDocRef, {
        progress: progress,
        progressLastModified: serverTimestamp()
      });

      await OfflineStorage.saveProgress(progress);
      return true;
    } catch (error) {
      console.error('Error syncing progress:', error);
      await OfflineStorage.saveProgress(progress);
      return false;
    }
  }

  // Obtener progreso
  static async getProgress() {
    try {
      const userDocRef = doc(db, this.COLLECTION_NAME, this.USER_ID);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (data.progress) {
          await OfflineStorage.saveProgress(data.progress);
          return data.progress;
        }
      }
      
      return await OfflineStorage.getProgress() || {};
    } catch (error) {
      console.error('Error getting progress from Firebase:', error);
      return await OfflineStorage.getProgress() || {};
    }
  }

  // Escuchar cambios en tiempo real (opcional)
  static subscribeToChanges(callback) {
    try {
      const userDocRef = doc(db, this.COLLECTION_NAME, this.USER_ID);
      
      return onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          callback(data);
        }
      });
    } catch (error) {
      console.error('Error subscribing to changes:', error);
      return null;
    }
  }

  // Verificar conectividad y sincronizar
  static async forcSync() {
    try {
      // Obtener datos locales
      const localCards = await OfflineStorage.getCards();
      const localProgress = await OfflineStorage.getProgress();

      // Obtener datos remotos
      const remoteCards = await this.getCards();
      const remoteProgress = await this.getProgress();

      // Determinar qué datos son más recientes y sincronizar
      if (localCards && localCards.length > 0) {
        await this.syncCards(localCards);
      }

      if (Object.keys(localProgress).length > 0) {
        await this.syncProgress(localProgress);
      }

      return { success: true, cards: remoteCards, progress: remoteProgress };
    } catch (error) {
      console.error('Error force syncing:', error);
      return { success: false, error: error.message };
    }
  }

  // Inicializar usuario (crear documento si no existe)
  static async initializeUser() {
    try {
      const userDocRef = doc(db, this.COLLECTION_NAME, this.USER_ID);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        // Crear documento inicial
        await setDoc(userDocRef, {
          cards: [],
          progress: {},
          createdAt: serverTimestamp(),
          lastModified: serverTimestamp()
        });
        console.log('User document initialized');
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing user:', error);
      return false;
    }
  }
}

export default FirebaseSync;