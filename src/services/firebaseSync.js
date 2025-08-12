// src/services/firebaseSync.js - SINCRONIZACIÓN PERSONAL SIMPLIFICADA CON ID FIJO
import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { OfflineStorage } from './offlineStorage';

// ID FIJO para tu uso personal - SIEMPRE EL MISMO EN TODOS LOS DISPOSITIVOS
const PERSONAL_USER_ID = 'kaWlDN6wBq2wrutghPuf';

// ⚠️ FUNCIÓN PARA MIGRAR DATOS EXISTENTES A ID FIJO
const migrateExistingData = async () => {
  try {
    console.log('🔄 Verificando si hay datos para migrar...');
    
    // Obtener todos los documentos de la colección
    const collectionRef = collection(db, 'chinese_flashcards');
    const querySnapshot = await getDocs(collectionRef);
    
    let dataToMigrate = null;
    let oldDocId = null;
    
    // Buscar documentos que NO sean el ID personal fijo
    querySnapshot.forEach((docSnapshot) => {
      if (docSnapshot.id !== PERSONAL_USER_ID) {
        console.log('📦 Encontrado documento para migrar:', docSnapshot.id);
        oldDocId = docSnapshot.id;
        dataToMigrate = docSnapshot.data();
      }
    });
    
    if (dataToMigrate && oldDocId) {
      console.log('🚚 Migrando datos de', oldDocId, 'a', PERSONAL_USER_ID);
      
      // Obtener datos existentes del ID fijo (si existen)
      const fixedDoc = await getDoc(doc(db, 'chinese_flashcards', PERSONAL_USER_ID));
      let existingData = { decks: [], cards: [], progress: {} };
      
      if (fixedDoc.exists()) {
        existingData = fixedDoc.data();
        console.log('📋 Datos existentes en ID fijo encontrados');
      }
      
      // Mergear datos
      const mergedData = {
        decks: [...(existingData.decks || []), ...(dataToMigrate.decks || [])],
        cards: [...(existingData.cards || []), ...(dataToMigrate.cards || [])],
        progress: { ...(existingData.progress || {}), ...(dataToMigrate.progress || {}) },
        lastUpdated: serverTimestamp(),
        deviceInfo: {
          migratedFrom: oldDocId,
          migrationDate: new Date().toISOString(),
          ...dataToMigrate.deviceInfo
        }
      };
      
      // Remover duplicados por ID
      mergedData.decks = Array.from(
        new Map(mergedData.decks.map(deck => [deck.id, deck])).values()
      );
      mergedData.cards = Array.from(
        new Map(mergedData.cards.map(card => [card.id, card])).values()
      );
      
      // Guardar datos mergeados en el ID fijo
      await setDoc(doc(db, 'chinese_flashcards', PERSONAL_USER_ID), mergedData);
      
      // Eliminar el documento antiguo
      await deleteDoc(doc(db, 'chinese_flashcards', oldDocId));
      
      console.log('✅ Migración completada exitosamente');
      console.log('📊 Datos migrados:', {
        decks: mergedData.decks.length,
        cards: mergedData.cards.length,
        progress: Object.keys(mergedData.progress).length
      });
      
      return true;
    } else {
      console.log('✅ No hay datos para migrar');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    return false;
  }
};

export const FirebaseSync = {
  currentUser: PERSONAL_USER_ID, // SIEMPRE EL MISMO ID
  isInitialized: false,

  // Inicialización con migración automática
  async initializeUser() {
    try {
      console.log('🔥 Inicializando Firebase con ID fijo:', PERSONAL_USER_ID);
      
      // Migrar datos existentes si es necesario
      await migrateExistingData();
      
      this.isInitialized = true;
      console.log('✅ Firebase inicializado correctamente');
      
      // Sincronizar automáticamente al inicializar
      await this.smartSync();
      return true;
    } catch (error) {
      console.error('❌ Error inicializando Firebase:', error);
      this.isInitialized = true; // Continuar aunque falle
      return false;
    }
  },

  // FORZAR USO DEL ID FIJO - Esta función garantiza que siempre usemos el ID correcto
  getUserId() {
    return PERSONAL_USER_ID; // SIEMPRE devuelve el ID fijo
  },

  // SINCRONIZACIÓN INTELIGENTE - Decide automáticamente qué hacer
  async smartSync() {
    try {
      console.log('🧠 Iniciando sincronización inteligente con ID:', this.getUserId());

      // Verificar conectividad
      const online = await this.isOnline();
      if (!online) {
        console.log('📱 Sin conexión, usando datos locales');
        return await this.getLocalData();
      }

      // Obtener datos de ambos lados
      const [firebaseData, localData] = await Promise.all([
        this.getFirebaseData(),
        this.getLocalData()
      ]);

      // Si Firebase está vacío, subimos los datos locales
      if (
        (!firebaseData.decks || firebaseData.decks.length === 0) &&
        (!firebaseData.cards || firebaseData.cards.length === 0)
      ) {
        console.log('⚠️ Firebase vacío, subiendo datos locales...');
        await this.saveFirebaseData(localData);
        return localData;
      }

      // Si local está vacío pero Firebase tiene datos, bajamos Firebase
      if (
        (!localData.decks || localData.decks.length === 0) &&
        (!localData.cards || localData.cards.length === 0)
      ) {
        console.log('📥 Datos locales vacíos, descargando desde Firebase...');
        await this.saveLocalData(firebaseData);
        return firebaseData;
      }

      // MERGEAR datos
      const mergedData = this.mergeData(firebaseData, localData);

      console.log('🔀 Datos mergeados:', {
        decks: mergedData.decks.length,
        cards: mergedData.cards.length,
        progress: Object.keys(mergedData.progress || {}).length
      });

      // Guardar datos mergeados en ambos lados
      await Promise.all([
        this.saveLocalData(mergedData),
        this.saveFirebaseData(mergedData)
      ]);

      console.log('✅ Sincronización completada');
      return mergedData;

    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      // Fallback a datos locales
      return await this.getLocalData();
    }
  },

  // MERGEAR datos de ambos lados (combinar lo mejor de ambos)
  mergeData(firebaseData, localData) {
    const mergedDecks = this.mergeDecks(firebaseData.decks || [], localData.decks || []);
    const mergedCards = this.mergeCards(firebaseData.cards || [], localData.cards || []);
    const mergedProgress = this.mergeProgress(firebaseData.progress || {}, localData.progress || {});

    return {
      decks: mergedDecks,
      cards: mergedCards,
      progress: mergedProgress
    };
  },

  // Mergear mazos - combinar sin duplicados
  mergeDecks(firebaseDecks, localDecks) {
    const merged = new Map();
    
    // Agregar mazos locales primero
    localDecks.forEach(deck => {
      if (deck && deck.id) {
        merged.set(deck.id, deck);
      }
    });
    
    // Agregar mazos de Firebase, actualizando si son más recientes
    firebaseDecks.forEach(deck => {
      if (deck && deck.id) {
        const existing = merged.get(deck.id);
        if (!existing || this.isNewer(deck, existing)) {
          merged.set(deck.id, deck);
        }
      }
    });
    
    return Array.from(merged.values());
  },

  // Mergear cartas - combinar sin duplicados
  mergeCards(firebaseCards, localCards) {
    const merged = new Map();
    
    // Agregar cartas locales primero
    localCards.forEach(card => {
      if (card && card.id) {
        merged.set(card.id, card);
      }
    });
    
    // Agregar cartas de Firebase, actualizando si son más recientes
    firebaseCards.forEach(card => {
      if (card && card.id) {
        const existing = merged.get(card.id);
        if (!existing || this.isNewer(card, existing)) {
          merged.set(card.id, card);
        }
      }
    });
    
    return Array.from(merged.values());
  },

  // Mergear progreso - mantener el más reciente por carta
  mergeProgress(firebaseProgress, localProgress) {
    const merged = { ...localProgress };
    
    Object.keys(firebaseProgress || {}).forEach(cardId => {
      const firebaseCardProgress = firebaseProgress[cardId];
      const localCardProgress = merged[cardId];
      
      if (!localCardProgress || this.isNewerProgress(firebaseCardProgress, localCardProgress)) {
        merged[cardId] = firebaseCardProgress;
      }
    });
    
    return merged;
  },

  // Verificar si un elemento es más nuevo que otro
  isNewer(item1, item2) {
    const date1 = new Date(item1.updatedAt || item1.createdAt || 0);
    const date2 = new Date(item2.updatedAt || item2.createdAt || 0);
    return date1 > date2;
  },

  // Verificar si el progreso es más nuevo
  isNewerProgress(progress1, progress2) {
    const date1 = new Date(progress1.lastUpdated || 0);
    const date2 = new Date(progress2.lastUpdated || 0);
    return date1 > date2;
  },

  // Obtener datos de Firebase - USANDO SIEMPRE EL ID FIJO
  async getFirebaseData() {
    try {
      const userDoc = doc(db, 'chinese_flashcards', this.getUserId()); // ID FIJO
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('📥 Datos obtenidos de Firebase:', {
          decks: (data.decks || []).length,
          cards: (data.cards || []).length,
          progress: Object.keys(data.progress || {}).length
        });
        
        return {
          decks: data.decks || [],
          cards: data.cards || [],
          progress: data.progress || {},
          lastUpdated: data.lastUpdated
        };
      }
      
      console.log('📭 No hay datos en Firebase para el ID fijo');
      return {
        decks: [],
        cards: [],
        progress: {},
        lastUpdated: null
      };
    } catch (error) {
      console.error('❌ Error obteniendo datos de Firebase:', error);
      return {
        decks: [],
        cards: [],
        progress: {},
        lastUpdated: null
      };
    }
  },

  // Obtener datos locales
  async getLocalData() {
    try {
      const [decks, cards, progress] = await Promise.all([
        OfflineStorage.getDecks(),
        OfflineStorage.getCards(),
        OfflineStorage.getProgress()
      ]);

      console.log('📱 Datos locales obtenidos:', {
        decks: decks.length,
        cards: cards.length,
        progress: Object.keys(progress).length
      });

      return { decks: decks || [], cards: cards || [], progress: progress || {} };
    } catch (error) {
      console.error('❌ Error obteniendo datos locales:', error);
      return {
        decks: [],
        cards: [],
        progress: {}
      };
    }
  },

  // Guardar datos en Firebase - USANDO SIEMPRE EL ID FIJO
  async saveFirebaseData(data) {
    try {
      const userDoc = doc(db, 'chinese_flashcards', this.getUserId()); // ID FIJO
      
      const dataToSave = {
        decks: data.decks || [],
        cards: data.cards || [],
        progress: data.progress || {},
        lastUpdated: serverTimestamp(),
        deviceInfo: this.getDeviceInfo()
      };

      await setDoc(userDoc, dataToSave, { merge: false }); // merge: false para reemplazar completamente

      console.log('💾 Datos guardados en Firebase con ID:', this.getUserId());
      console.log('📊 Datos guardados:', {
        decks: dataToSave.decks.length,
        cards: dataToSave.cards.length,
        progress: Object.keys(dataToSave.progress).length
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error guardando en Firebase:', error);
      return false;
    }
  },

  // Guardar datos localmente
  async saveLocalData(data) {
    try {
      await Promise.all([
        OfflineStorage.saveDecks(data.decks || []),
        OfflineStorage.saveCards(data.cards || []),
        OfflineStorage.saveProgress(data.progress || {})
      ]);

      console.log('💾 Datos guardados localmente');
      return true;
    } catch (error) {
      console.error('❌ Error guardando localmente:', error);
      return false;
    }
  },

  // FUNCIONES PRINCIPALES PARA LA APP

  // Obtener mazos (con sincronización automática)
  async getDecks() {
    if (!this.isInitialized) await this.initializeUser();
    
    const data = await this.smartSync();
    return data.decks;
  },

  // Guardar mazos (sincroniza automáticamente)
  async syncDecks(decks) {
    try {
      // Guardar localmente primero (rápido)
      await OfflineStorage.saveDecks(decks);
      
      // Intentar guardar en Firebase (puede fallar si no hay conexión)
      if (await this.isOnline()) {
        const currentData = await this.getLocalData();
        await this.saveFirebaseData({
          ...currentData,
          decks: decks
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error sincronizando mazos:', error);
      return false;
    }
  },

  // Obtener cartas (con sincronización automática)
  async getCards() {
    if (!this.isInitialized) await this.initializeUser();
    
    const data = await this.smartSync();
    return data.cards;
  },

  // Guardar cartas (sincroniza automáticamente)
  async syncCards(cards) {
    try {
      // Guardar localmente primero
      await OfflineStorage.saveCards(cards);
      
      // Intentar guardar en Firebase
      if (await this.isOnline()) {
        const currentData = await this.getLocalData();
        await this.saveFirebaseData({
          ...currentData,
          cards: cards
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error sincronizando cartas:', error);
      return false;
    }
  },

  // Obtener progreso (con sincronización automática)
  async getProgress() {
    if (!this.isInitialized) await this.initializeUser();
    
    const data = await this.smartSync();
    return data.progress;
  },

  // Guardar progreso (sincroniza automáticamente)
  async syncProgress(progress) {
    try {
      // Guardar localmente primero
      await OfflineStorage.saveProgress(progress);
      
      // Intentar guardar en Firebase
      if (await this.isOnline()) {
        const currentData = await this.getLocalData();
        await this.saveFirebaseData({
          ...currentData,
          progress: progress
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error sincronizando progreso:', error);
      return false;
    }
  },

  // FUNCIÓN DE SINCRONIZACIÓN FORZADA (para botón de Sync)
  async forceSyncAll() {
    try {
      console.log('🚀 SINCRONIZACIÓN FORZADA - Mergeando todo...');
      console.log('🆔 Usando ID fijo:', this.getUserId());
      
      const online = await this.isOnline();
      if (!online) {
        console.log('❌ Sin conexión para sincronización forzada');
        return { success: false, error: 'Sin conexión a internet' };
      }

      // Verificar y migrar datos existentes
      await migrateExistingData();

      // Obtener todos los datos
      const [firebaseData, localData] = await Promise.all([
        this.getFirebaseData(),
        this.getLocalData()
      ]);

      console.log('📊 Datos antes del merge:');
      console.log('  Firebase:', {
        decks: firebaseData.decks.length,
        cards: firebaseData.cards.length,
        progress: Object.keys(firebaseData.progress).length
      });
      console.log('  Local:', {
        decks: localData.decks.length,
        cards: localData.cards.length,
        progress: Object.keys(localData.progress).length
      });

      // Mergear TODO
      const mergedData = this.mergeData(firebaseData, localData);
      
      console.log('✅ Datos después del merge:', {
        decks: mergedData.decks.length,
        cards: mergedData.cards.length,
        progress: Object.keys(mergedData.progress).length
      });

      // Guardar en ambos lados
      await Promise.all([
        this.saveLocalData(mergedData),
        this.saveFirebaseData(mergedData)
      ]);

      console.log('🎉 Sincronización forzada completada con ID:', this.getUserId());
      return { success: true, data: mergedData };
    } catch (error) {
      console.error('❌ Error en sincronización forzada:', error);
      return { success: false, error: error.message };
    }
  },

  // Forzar subida desde local a Firebase
  async forceUpload() {
    try {
      console.log('⬆️ FORZANDO subida a Firebase con ID:', this.getUserId());
      
      const localData = await this.getLocalData();
      const success = await this.saveFirebaseData(localData);
      
      if (success) {
        console.log('✅ Subida forzada completada');
        return { success: true, data: localData };
      } else {
        throw new Error('Error al subir a Firebase');
      }
    } catch (error) {
      console.error('❌ Error en subida forzada:', error);
      return { success: false, error: error.message };
    }
  },

  // Forzar descarga desde Firebase
  async forceDownload() {
    try {
      console.log('⬇️ FORZANDO descarga desde Firebase con ID:', this.getUserId());
      
      const firebaseData = await this.getFirebaseData();
      
      if (firebaseData.decks.length === 0 && firebaseData.cards.length === 0) {
        return { success: false, error: 'No hay datos en Firebase' };
      }

      await this.saveLocalData(firebaseData);
      
      console.log('✅ Descarga forzada completada');
      return { success: true, data: firebaseData };
    } catch (error) {
      console.error('❌ Error en descarga forzada:', error);
      return { success: false, error: error.message };
    }
  },

  // Alias para compatibilidad
  async forceSync() {
    return await this.forceSyncAll();
  },

  // UTILIDADES

  // Verificar conectividad
  async isOnline() {
    try {
      const testDoc = doc(db, 'chinese_flashcards', 'connection_test');
      await getDoc(testDoc);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Obtener información del dispositivo
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      timestamp: new Date().toISOString(),
      url: window.location.hostname,
      fixedUserId: this.getUserId() // Incluir el ID fijo en la info
    };
  },

  // Obtener estadísticas
  async getStats() {
    try {
      const [firebaseData, localData] = await Promise.all([
        this.getFirebaseData(),
        this.getLocalData()
      ]);

      return {
        userId: this.getUserId(),
        firebase: {
          decks: firebaseData.decks.length,
          cards: firebaseData.cards.length,
          progress: Object.keys(firebaseData.progress).length,
          lastUpdated: firebaseData.lastUpdated
        },
        local: {
          decks: localData.decks.length,
          cards: localData.cards.length,
          progress: Object.keys(localData.progress).length
        },
        online: await this.isOnline()
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  },

  // Limpiar datos (para debugging)
  async clearAllData() {
    try {
      // Limpiar Firebase con el ID fijo
      await this.saveFirebaseData({
        decks: [],
        cards: [],
        progress: {}
      });
      
      // Limpiar local
      await OfflineStorage.clearAllData();
      
      console.log('🗑️ Todos los datos limpiados del ID:', this.getUserId());
      return true;
    } catch (error) {
      console.error('❌ Error limpiando datos:', error);
      return false;
    }
  },

  // FUNCIÓN ESPECIAL: Migrar manualmente todos los datos al ID fijo
  async migrateAllDataToFixedId() {
    try {
      console.log('🔄 Iniciando migración manual de todos los datos...');
      
      const result = await migrateExistingData();
      
      if (result) {
        console.log('✅ Migración manual completada');
        // Realizar sincronización después de la migración
        await this.smartSync();
        return { success: true, message: 'Datos migrados exitosamente' };
      } else {
        console.log('ℹ️ No había datos para migrar');
        return { success: true, message: 'No había datos para migrar' };
      }
    } catch (error) {
      console.error('❌ Error en migración manual:', error);
      return { success: false, error: error.message };
    }
  }
};

export default FirebaseSync;