// src/services/firebaseSync.js - SINCRONIZACIÓN BIDIRECCIONAL CORREGIDA
import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { OfflineStorage } from './offlineStorage';

// ID FIJO para tu uso personal
const PERSONAL_USER_ID = 'my_chinese_flashcards_personal';

export const FirebaseSync = {
  currentUser: PERSONAL_USER_ID,
  isInitialized: false,
  isOnlineMode: true,
  unsubscribeListener: null,
  initPromise: null,
  lastSyncTimestamp: 0,
  syncInProgress: false,
  
  // ============================================
  // DEBUGGING Y LOGGING MEJORADO
  // ============================================
  log(message, data = null) {
    const timestamp = new Date().toISOString();
    const deviceInfo = this.getDeviceInfo();
    console.log(`[FirebaseSync][${deviceInfo}][${timestamp}] ${message}`, data || '');
  },

  getDeviceInfo() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const platform = navigator.platform || 'Unknown';
    return `${isMobile ? 'Mobile' : 'Desktop'}-${platform}`;
  },

  // ============================================
  // MIGRACIÓN MEJORADA
  // ============================================
  async migrateExistingData() {
    try {
      this.log('🔄 Verificando migración...');
      
      const collectionRef = collection(db, 'chinese_flashcards');
      const querySnapshot = await getDocs(collectionRef);
      
      let dataToMigrate = null;
      let oldDocId = null;
      
      querySnapshot.forEach((docSnapshot) => {
        if (docSnapshot.id !== PERSONAL_USER_ID) {
          this.log('📦 Documento para migrar encontrado:', docSnapshot.id);
          oldDocId = docSnapshot.id;
          dataToMigrate = docSnapshot.data();
        }
      });
      
      if (dataToMigrate && oldDocId) {
        this.log('🚚 Iniciando migración de datos...');
        
        // Verificar si ya existe el documento fijo
        const fixedDoc = await getDoc(doc(db, 'chinese_flashcards', PERSONAL_USER_ID));
        let existingData = { decks: [], cards: [], progress: {} };
        
        if (fixedDoc.exists()) {
          existingData = fixedDoc.data();
        }
        
        // Mergear datos evitando duplicados
        const mergedData = {
          decks: this.mergeArraysById([...(existingData.decks || []), ...(dataToMigrate.decks || [])]),
          cards: this.mergeArraysById([...(existingData.cards || []), ...(dataToMigrate.cards || [])]),
          progress: { ...(existingData.progress || {}), ...(dataToMigrate.progress || {}) },
          lastUpdated: serverTimestamp(),
          syncVersion: Date.now(),
          device: this.getDeviceInfo(),
          migratedFrom: oldDocId,
          migrationDate: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'chinese_flashcards', PERSONAL_USER_ID), mergedData);
        await deleteDoc(doc(db, 'chinese_flashcards', oldDocId));
        
        this.log('✅ Migración completada exitosamente');
        return true;
      }
      
      this.log('ℹ️ No se encontraron datos para migrar');
      return false;
    } catch (error) {
      this.log('❌ Error en migración:', error);
      return false;
    }
  },

  // Mergear arrays evitando duplicados por ID
  mergeArraysById(array) {
    const map = new Map();
    array.forEach(item => {
      if (item && item.id) {
        // Priorizar elementos con timestamp más reciente
        const existing = map.get(item.id);
        if (!existing || (item.updatedAt && (!existing.updatedAt || new Date(item.updatedAt) > new Date(existing.updatedAt)))) {
          map.set(item.id, item);
        }
      }
    });
    return Array.from(map.values());
  },

  // ============================================
  // INICIALIZACIÓN MEJORADA
  // ============================================
  async initializeUser() {
    // Evitar múltiples inicializaciones
    if (this.initPromise) {
      this.log('⏳ Inicialización ya en progreso, esperando...');
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        this.log('🔥 Iniciando Firebase Sync...');
        
        // Verificar conectividad con timeout
        this.isOnlineMode = await this.checkConnectionWithTimeout();
        this.log(`🌐 Estado de conexión: ${this.isOnlineMode ? 'ONLINE' : 'OFFLINE'}`);
        
        if (this.isOnlineMode) {
          // Migrar datos si es necesario
          await this.migrateExistingData();
          
          // Configurar listener en tiempo real con reintentos
          await this.setupRealtimeListener();
        }
        
        this.isInitialized = true;
        this.log('✅ Firebase Sync inicializado correctamente');
        
        return true;
      } catch (error) {
        this.log('❌ Error inicializando Firebase Sync:', error);
        this.isInitialized = true; // Marcar como inicializado para evitar loops
        return false;
      }
    })();

    return this.initPromise;
  },

  // ============================================
  // LISTENER EN TIEMPO REAL MEJORADO
  // ============================================
  async setupRealtimeListener() {
    if (this.unsubscribeListener) {
      this.log('🔌 Desconectando listener anterior...');
      this.unsubscribeListener();
    }

    try {
      const userDoc = doc(db, 'chinese_flashcards', PERSONAL_USER_ID);
      
      this.log('👂 Configurando listener en tiempo real...');
      
      this.unsubscribeListener = onSnapshot(
        userDoc, 
        async (docSnapshot) => {
          try {
            this.log('🔔 Snapshot recibido', { exists: docSnapshot.exists() });
            
            if (docSnapshot.exists()) {
              const firebaseData = docSnapshot.data();
              this.log('📊 Datos de Firebase recibidos:', {
                decks: firebaseData.decks?.length || 0,
                cards: firebaseData.cards?.length || 0,
                progress: Object.keys(firebaseData.progress || {}).length,
                syncVersion: firebaseData.syncVersion,
                device: firebaseData.device
              });
              
              // CLAVE: Verificar si este cambio no proviene de este mismo dispositivo
              if (firebaseData.device && firebaseData.device === this.getDeviceInfo()) {
                this.log('⚠️ Cambio proviene de este mismo dispositivo, ignorando para evitar loop');
                return;
              }
              
              // Verificar si hay cambios reales
              if (this.lastSyncTimestamp && firebaseData.syncVersion <= this.lastSyncTimestamp) {
                this.log('⚠️ Datos no son más recientes, ignorando');
                return;
              }
              
              this.log('🔄 Cambios detectados desde otro dispositivo, aplicando...');
              
              // Obtener datos locales actuales
              const localData = await this.getLocalData();
              
              // Aplicar merge inteligente
              const mergedData = this.intelligentMerge(firebaseData, localData);
              
              // Guardar localmente SIN sincronizar de vuelta
              await this.saveLocalDataOnly(mergedData);
              
              // Actualizar timestamp local
              this.lastSyncTimestamp = firebaseData.syncVersion || Date.now();
              
              // Notificar a la UI
              this.notifyUIUpdate(mergedData);
              
              this.log('✅ Cambios aplicados correctamente');
            } else {
              this.log('⚠️ Documento no existe en Firebase');
            }
          } catch (error) {
            this.log('❌ Error procesando snapshot:', error);
          }
        },
        (error) => {
          this.log('❌ Error en listener:', error);
          this.isOnlineMode = false;
          
          // Reintentar conexión después de un delay
          setTimeout(() => {
            this.log('🔄 Reintentando configurar listener...');
            this.setupRealtimeListener();
          }, 5000);
        }
      );
      
      this.log('✅ Listener configurado correctamente');
    } catch (error) {
      this.log('❌ Error configurando listener:', error);
    }
  },

  // ============================================
  // MERGE INTELIGENTE MEJORADO
  // ============================================
  intelligentMerge(firebaseData, localData) {
    this.log('🧠 Ejecutando merge inteligente...');
    
    // Merge de mazos con prioridad por timestamp
    const allDecks = [
      ...(localData.decks || []),
      ...(firebaseData.decks || [])
    ];
    const mergedDecks = this.mergeArraysById(allDecks);
    
    // Merge de cartas con prioridad por timestamp
    const allCards = [
      ...(localData.cards || []),
      ...(firebaseData.cards || [])
    ];
    const mergedCards = this.mergeArraysById(allCards);
    
    // Merge de progreso con prioridad por lastUpdated más reciente
    const mergedProgress = { ...localData.progress };
    Object.keys(firebaseData.progress || {}).forEach(cardId => {
      const firebaseProgressItem = firebaseData.progress[cardId];
      const localProgressItem = mergedProgress[cardId];
      
      if (!localProgressItem || 
          (firebaseProgressItem.lastUpdated && 
           (!localProgressItem.lastUpdated || 
            new Date(firebaseProgressItem.lastUpdated) > new Date(localProgressItem.lastUpdated)))) {
        mergedProgress[cardId] = firebaseProgressItem;
      }
    });

    const result = {
      decks: mergedDecks,
      cards: mergedCards,
      progress: mergedProgress
    };
    
    this.log('🔀 Merge completado:', {
      decks: result.decks.length,
      cards: result.cards.length,
      progress: Object.keys(result.progress).length
    });
    
    return result;
  },

  // ============================================
  // VERIFICACIÓN DE CONEXIÓN MEJORADA
  // ============================================
  async checkConnectionWithTimeout(timeoutMs = 5000) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), timeoutMs);
      });
      
      const testPromise = (async () => {
        const testDoc = doc(db, 'chinese_flashcards', 'connection_test');
        await getDoc(testDoc);
        return true;
      })();
      
      await Promise.race([testPromise, timeoutPromise]);
      this.isOnlineMode = true;
      return true;
    } catch (error) {
      this.log('📡 Verificación de conexión falló:', error.message);
      this.isOnlineMode = false;
      return false;
    }
  },

  async checkConnection() {
    return this.checkConnectionWithTimeout();
  },

  // ============================================
  // SINCRONIZACIÓN INTELIGENTE MEJORADA
  // ============================================
  async smartSync(forceSync = false) {
    // Prevenir sincronizaciones concurrentes
    if (this.syncInProgress && !forceSync) {
      this.log('⚠️ Sincronización ya en progreso, saltando...');
      return await this.getLocalData();
    }

    this.syncInProgress = true;

    try {
      this.log('🧠 Iniciando sincronización inteligente...', { forceSync });

      // Verificar conectividad
      const online = await this.checkConnectionWithTimeout();
      if (!online) {
        this.log('📱 Modo offline, retornando datos locales');
        return await this.getLocalData();
      }

      // Obtener datos de ambos lados
      const [firebaseData, localData] = await Promise.all([
        this.getFirebaseData(),
        this.getLocalData()
      ]);

      this.log('📊 Datos obtenidos:', {
        firebase: {
          decks: firebaseData.decks?.length || 0,
          cards: firebaseData.cards?.length || 0,
          progress: Object.keys(firebaseData.progress || {}).length,
          syncVersion: firebaseData.syncVersion
        },
        local: {
          decks: localData.decks?.length || 0,
          cards: localData.cards?.length || 0,
          progress: Object.keys(localData.progress || {}).length
        }
      });

      // Determinar estrategia de sincronización
      const firebaseEmpty = this.isDataEmpty(firebaseData);
      const localEmpty = this.isDataEmpty(localData);

      let finalData;

      if (firebaseEmpty && !localEmpty) {
        // Subir datos locales
        this.log('⬆️ Firebase vacío, subiendo datos locales');
        finalData = localData;
        await this.saveFirebaseDataWithVersion(finalData);
      } else if (localEmpty && !firebaseEmpty) {
        // Descargar datos de Firebase
        this.log('⬇️ Local vacío, descargando desde Firebase');
        finalData = firebaseData;
        await this.saveLocalDataOnly(finalData);
      } else if (!firebaseEmpty && !localEmpty) {
        // Mergear ambos
        this.log('🔀 Ambos con datos, mergeando inteligentemente');
        finalData = this.intelligentMerge(firebaseData, localData);
        
        await Promise.all([
          this.saveLocalDataOnly(finalData),
          this.saveFirebaseDataWithVersion(finalData)
        ]);
      } else {
        // Ambos vacíos
        this.log('📭 Ambos vacíos, inicializando estructura');
        finalData = { decks: [], cards: [], progress: {} };
      }

      this.log('✅ Sincronización completada exitosamente');
      return finalData;

    } catch (error) {
      this.log('❌ Error en sincronización inteligente:', error);
      return await this.getLocalData();
    } finally {
      this.syncInProgress = false;
    }
  },

  // ============================================
  // GUARDADO CON VERSIONING
  // ============================================
  async saveFirebaseDataWithVersion(data) {
    try {
      if (!this.isOnlineMode && !(await this.checkConnectionWithTimeout())) {
        this.log('📡 Sin conexión para guardar en Firebase');
        return false;
      }

      const userDoc = doc(db, 'chinese_flashcards', PERSONAL_USER_ID);
      
      const syncVersion = Date.now();
      const dataToSave = {
        decks: data.decks || [],
        cards: data.cards || [],
        progress: data.progress || {},
        lastUpdated: serverTimestamp(),
        syncVersion: syncVersion,
        device: this.getDeviceInfo(),
        timestamp: new Date().toISOString()
      };

      await setDoc(userDoc, dataToSave);
      this.lastSyncTimestamp = syncVersion;
      
      this.log('💾 Datos guardados en Firebase', {
        syncVersion,
        device: dataToSave.device,
        decks: dataToSave.decks.length,
        cards: dataToSave.cards.length
      });
      
      return true;
    } catch (error) {
      this.log('❌ Error guardando en Firebase:', error);
      this.isOnlineMode = false;
      return false;
    }
  },

  // Guardar solo localmente (sin sincronizar)
  async saveLocalDataOnly(data) {
    try {
      await Promise.all([
        OfflineStorage.saveDecks(data.decks || []),
        OfflineStorage.saveCards(data.cards || []),
        OfflineStorage.saveProgress(data.progress || {})
      ]);

      localStorage.setItem('lastLocalUpdate', new Date().toISOString());
      this.log('💾 Datos guardados localmente (solo local)');
      return true;
    } catch (error) {
      this.log('❌ Error guardando localmente:', error);
      return false;
    }
  },

  // Notificar actualización a la UI
  notifyUIUpdate(data) {
    try {
      window.dispatchEvent(new CustomEvent('firebaseDataUpdated', {
        detail: {
          ...data,
          source: 'firebase_listener',
          timestamp: new Date().toISOString()
        }
      }));
      this.log('📢 UI notificada de actualización');
    } catch (error) {
      this.log('❌ Error notificando UI:', error);
    }
  },

  // ============================================
  // MÉTODOS DE DATOS EXISTENTES MEJORADOS
  // ============================================
  
  // Verificar si los datos están vacíos
  isDataEmpty(data) {
    return (!data.decks || data.decks.length === 0) && 
           (!data.cards || data.cards.length === 0) &&
           (!data.progress || Object.keys(data.progress).length === 0);
  },

  // Obtener datos de Firebase
  async getFirebaseData() {
    try {
      const userDoc = doc(db, 'chinese_flashcards', PERSONAL_USER_ID);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          decks: data.decks || [],
          cards: data.cards || [],
          progress: data.progress || {},
          lastUpdated: data.lastUpdated,
          syncVersion: data.syncVersion,
          device: data.device
        };
      }
      
      return { decks: [], cards: [], progress: {}, lastUpdated: null, syncVersion: 0 };
    } catch (error) {
      this.log('❌ Error obteniendo datos de Firebase:', error);
      return { decks: [], cards: [], progress: {}, lastUpdated: null, syncVersion: 0 };
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

      return { 
        decks: decks || [], 
        cards: cards || [], 
        progress: progress || {} 
      };
    } catch (error) {
      this.log('❌ Error obteniendo datos locales:', error);
      return { decks: [], cards: [], progress: {} };
    }
  },

  // ============================================
  // FUNCIONES PRINCIPALES MEJORADAS
  // ============================================

  // Obtener mazos
  async getDecks() {
    if (!this.isInitialized) await this.initializeUser();
    const data = await this.smartSync();
    return data.decks;
  },

  // Sincronizar mazos (VERSIÓN MEJORADA)
  async syncDecks(decks) {
    try {
      this.log('🔄 Sincronizando mazos...', { count: decks.length });
      
      const decksWithTimestamp = decks.map(deck => ({
        ...deck,
        updatedAt: new Date().toISOString()
      }));

      // Guardar localmente primero
      await OfflineStorage.saveDecks(decksWithTimestamp);
      localStorage.setItem('lastLocalUpdate', new Date().toISOString());
      
      // Sincronizar con Firebase si hay conexión
      if (await this.checkConnectionWithTimeout()) {
        const currentData = await this.getLocalData();
        await this.saveFirebaseDataWithVersion({
          ...currentData,
          decks: decksWithTimestamp
        });
      }
      
      this.log('✅ Mazos sincronizados correctamente');
      return true;
    } catch (error) {
      this.log('❌ Error sincronizando mazos:', error);
      return false;
    }
  },

  // Obtener cartas
  async getCards() {
    if (!this.isInitialized) await this.initializeUser();
    const data = await this.smartSync();
    return data.cards;
  },

  // Sincronizar cartas (VERSIÓN MEJORADA)
  async syncCards(cards) {
    try {
      this.log('🔄 Sincronizando cartas...', { count: cards.length });
      
      const cardsWithTimestamp = cards.map(card => ({
        ...card,
        updatedAt: new Date().toISOString()
      }));

      // Guardar localmente primero
      await OfflineStorage.saveCards(cardsWithTimestamp);
      localStorage.setItem('lastLocalUpdate', new Date().toISOString());
      
      // Sincronizar con Firebase si hay conexión
      if (await this.checkConnectionWithTimeout()) {
        const currentData = await this.getLocalData();
        await this.saveFirebaseDataWithVersion({
          ...currentData,
          cards: cardsWithTimestamp
        });
      }
      
      this.log('✅ Cartas sincronizadas correctamente');
      return true;
    } catch (error) {
      this.log('❌ Error sincronizando cartas:', error);
      return false;
    }
  },

  // Obtener progreso
  async getProgress() {
    if (!this.isInitialized) await this.initializeUser();
    const data = await this.smartSync();
    return data.progress;
  },

  // Sincronizar progreso (VERSIÓN MEJORADA)
  async syncProgress(progress) {
    try {
      this.log('🔄 Sincronizando progreso...', { count: Object.keys(progress).length });
      
      const progressWithTimestamp = {};
      Object.keys(progress).forEach(cardId => {
        progressWithTimestamp[cardId] = {
          ...progress[cardId],
          lastUpdated: new Date().toISOString()
        };
      });

      // Guardar localmente primero
      await OfflineStorage.saveProgress(progressWithTimestamp);
      localStorage.setItem('lastLocalUpdate', new Date().toISOString());
      
      // Sincronizar con Firebase si hay conexión
      if (await this.checkConnectionWithTimeout()) {
        const currentData = await this.getLocalData();
        await this.saveFirebaseDataWithVersion({
          ...currentData,
          progress: progressWithTimestamp
        });
      }
      
      this.log('✅ Progreso sincronizado correctamente');
      return true;
    } catch (error) {
      this.log('❌ Error sincronizando progreso:', error);
      return false;
    }
  },

  // Sincronización forzada
  async forceSyncAll() {
    try {
      this.log('🚀 Iniciando sincronización forzada');
      
      const online = await this.checkConnectionWithTimeout();
      if (!online) {
        return { success: false, error: 'Sin conexión a Internet' };
      }

      // Reiniciar listener
      await this.setupRealtimeListener();
      const result = await this.smartSync(true);
      
      this.log('✅ Sincronización forzada completada');
      return { success: true, data: result };
    } catch (error) {
      this.log('❌ Error en sincronización forzada:', error);
      return { success: false, error: error.message };
    }
  },

  // Limpiar recursos
  cleanup() {
    this.log('🧹 Limpiando recursos de FirebaseSync...');
    
    if (this.unsubscribeListener) {
      this.unsubscribeListener();
      this.unsubscribeListener = null;
    }
    this.initPromise = null;
    this.syncInProgress = false;
    
    this.log('✅ Recursos limpiados');
  },

  // Obtener estadísticas mejoradas
  async getStats() {
    try {
      const [firebaseData, localData] = await Promise.all([
        this.getFirebaseData(),
        this.getLocalData()
      ]);

      return {
        userId: PERSONAL_USER_ID,
        device: this.getDeviceInfo(),
        online: this.isOnlineMode,
        initialized: this.isInitialized,
        syncInProgress: this.syncInProgress,
        lastSyncTimestamp: this.lastSyncTimestamp,
        firebase: {
          decks: firebaseData.decks.length,
          cards: firebaseData.cards.length,
          progress: Object.keys(firebaseData.progress).length,
          lastUpdated: firebaseData.lastUpdated,
          syncVersion: firebaseData.syncVersion,
          device: firebaseData.device
        },
        local: {
          decks: localData.decks.length,
          cards: localData.cards.length,
          progress: Object.keys(localData.progress).length,
          lastLocalUpdate: localStorage.getItem('lastLocalUpdate')
        }
      };
    } catch (error) {
      this.log('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  }
};

export default FirebaseSync;