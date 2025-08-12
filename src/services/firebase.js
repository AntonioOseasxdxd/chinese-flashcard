// src/services/firebase.js - CONFIGURACIÓN MEJORADA PARA SINCRONIZACIÓN BIDIRECCIONAL
import { initializeApp } from "firebase/app";
import { 
  getFirestore,
  enableNetwork,
  disableNetwork,
  connectFirestoreEmulator
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDHM-P0oVfUv_8vGNODDOaQi4PUfmwhMmE",
  authDomain: "chinese-flashcards-a12f8.firebaseapp.com",
  projectId: "chinese-flashcards-a12f8",
  storageBucket: "chinese-flashcards-a12f8.firebasestorage.app",
  messagingSenderId: "690764775481",
  appId: "1:690764775481:web:019ae3edd13cae27128de8",
  measurementId: "G-QBJY3QNWMV"
};

// Initialize Firebase - UNA SOLA VEZ
const app = initializeApp(firebaseConfig);

// Initialize Firestore con configuración optimizada
const db = getFirestore(app);

// Estado de conexión mejorado
let connectionState = 'initializing';
let initializationPromise = null;
let connectionMonitorInterval = null;
let isEmulatorMode = false;

// Logging mejorado
const log = (message, data = null) => {
  const timestamp = new Date().toISOString();
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const device = isMobile ? 'Mobile' : 'Desktop';
  console.log(`[Firebase][${device}][${timestamp}] ${message}`, data || '');
};

// Función de inicialización mejorada
const initializeFirestoreConnection = async () => {
  if (initializationPromise) {
    log('⏳ Inicialización ya en progreso...');
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      log('🔥 Inicializando Firestore...');
      
      // Configurar emulador en desarrollo si está disponible
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_FIRESTORE_EMULATOR === 'true') {
        try {
          connectFirestoreEmulator(db, 'localhost', 8080);
          isEmulatorMode = true;
          log('🔧 Conectado al emulador de Firestore');
        } catch (error) {
          log('⚠️ No se pudo conectar al emulador, usando producción');
        }
      }
      
      // Habilitar la red con reintentos
      await enableNetworkWithRetry();
      connectionState = 'online';
      
      log('✅ Firestore inicializado correctamente', {
        emulator: isEmulatorMode,
        state: connectionState
      });
      
      return true;
    } catch (error) {
      log('❌ Error inicializando Firestore:', error);
      connectionState = 'offline';
      return false;
    }
  })();

  return initializationPromise;
};

// Función para habilitar la red con reintentos
const enableNetworkWithRetry = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log(`🌐 Intento ${attempt}/${maxRetries} de habilitar red...`);
      await enableNetwork(db);
      return true;
    } catch (error) {
      log(`❌ Error en intento ${attempt}:`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Función para verificar conexión mejorada con timeout personalizable
export const checkFirestoreConnection = async (timeoutMs = 5000) => {
  try {
    log('🔍 Verificando conexión...');
    
    const { doc, getDoc } = await import('firebase/firestore');
    const testRef = doc(db, 'connection_test', 'ping');
    
    // Promise de timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Connection timeout after ${timeoutMs}ms`)), timeoutMs);
    });
    
    // Promise de prueba de conexión
    const testPromise = getDoc(testRef);
    
    await Promise.race([testPromise, timeoutPromise]);
    
    connectionState = 'online';
    log('✅ Conexión verificada exitosamente');
    return true;
  } catch (error) {
    log('📡 Verificación de conexión falló:', error.message);
    connectionState = 'offline';
    return false;
  }
};

// Función para ir offline con limpieza
export const goOffline = async () => {
  try {
    log('📱 Deshabilitando red...');
    await disableNetwork(db);
    connectionState = 'offline';
    log('✅ Firestore offline');
    return true;
  } catch (error) {
    log('❌ Error al ir offline:', error);
    return false;
  }
};

// Función para ir online con verificación
export const goOnline = async () => {
  try {
    log('🌐 Habilitando red...');
    await enableNetworkWithRetry();
    
    // Verificar que la conexión funciona realmente
    const isConnected = await checkFirestoreConnection();
    
    if (isConnected) {
      connectionState = 'online';
      log('✅ Firestore online y verificado');
      
      // Disparar evento personalizado para notificar reconexión
      window.dispatchEvent(new CustomEvent('firestoreReconnected', {
        detail: { timestamp: new Date().toISOString() }
      }));
      
      return true;
    } else {
      connectionState = 'offline';
      log('⚠️ Red habilitada pero sin conectividad real');
      return false;
    }
  } catch (error) {
    log('❌ Error al ir online:', error);
    connectionState = 'offline';
    return false;
  }
};

// Obtener estado de conexión detallado
export const getConnectionState = () => {
  return {
    state: connectionState,
    emulator: isEmulatorMode,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    online: navigator.onLine
  };
};

// Monitor de conexión inteligente
const startConnectionMonitor = () => {
  if (connectionMonitorInterval) {
    log('🔄 Reiniciando monitor de conexión...');
    clearInterval(connectionMonitorInterval);
  }

  log('👁️ Iniciando monitor de conexión...');

  // Monitor principal cada 30 segundos
  connectionMonitorInterval = setInterval(async () => {
    if (connectionState === 'offline') {
      log('🔄 Estado offline detectado, verificando reconexión...');
      const isOnline = await checkFirestoreConnection(3000); // Timeout más corto para el monitor
      if (isOnline) {
        log('🎉 Reconexión detectada!');
        window.dispatchEvent(new CustomEvent('firestoreReconnected', {
          detail: { 
            timestamp: new Date().toISOString(),
            source: 'monitor'
          }
        }));
      }
    }
  }, 30000); // Cada 30 segundos

  // Escuchar eventos del navegador
  const handleBrowserOnline = async () => {
    log('🌐 Evento online del navegador detectado');
    setTimeout(async () => {
      await goOnline();
    }, 1000); // Pequeño delay para que la conexión se estabilice
  };

  const handleBrowserOffline = () => {
    log('📡 Evento offline del navegador detectado');
    connectionState = 'offline';
    window.dispatchEvent(new CustomEvent('firestoreDisconnected', {
      detail: { 
        timestamp: new Date().toISOString(),
        source: 'browser'
      }
    }));
  };

  // Escuchar cambios de visibilidad para verificar conexión al volver
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && connectionState === 'offline') {
      log('👁️ Página visible nuevamente, verificando conexión...');
      setTimeout(async () => {
        await checkFirestoreConnection();
      }, 500);
    }
  };

  window.addEventListener('online', handleBrowserOnline);
  window.addEventListener('offline', handleBrowserOffline);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Función de limpieza
  return () => {
    log('🧹 Limpiando monitor de conexión...');
    if (connectionMonitorInterval) {
      clearInterval(connectionMonitorInterval);
      connectionMonitorInterval = null;
    }
    window.removeEventListener('online', handleBrowserOnline);
    window.removeEventListener('offline', handleBrowserOffline);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

// Función de limpieza completa
export const cleanup = async () => {
  try {
    log('🧹 Iniciando limpieza completa de Firebase...');
    
    if (connectionMonitorInterval) {
      clearInterval(connectionMonitorInterval);
      connectionMonitorInterval = null;
    }
    
    await disableNetwork(db);
    connectionState = 'offline';
    
    log('✅ Limpieza completa de Firebase completada');
  } catch (error) {
    log('❌ Error durante limpieza:', error);
  }
};

// Función para reinicializar la conexión
const reinitializeConnection = async () => {
  try {
    log('🔄 Reinicializando conexión...');
    
    // Limpiar estado anterior
    if (connectionMonitorInterval) {
      clearInterval(connectionMonitorInterval);
    }
    
    // Reinicializar
    initializationPromise = null;
    const result = await initializeFirestoreConnection();
    
    if (result) {
      cleanupFunction = startConnectionMonitor();
    }
    
    return result;
  } catch (error) {
    log('❌ Error reinicializando:', error);
    return false;
  }
};

// Función para obtener métricas de rendimiento
const getPerformanceMetrics = () => {
  return {
    connectionState,
    isEmulatorMode,
    initializationTime: initializationPromise ? 'completed' : 'pending',
    monitorActive: !!connectionMonitorInterval,
    browserOnline: navigator.onLine,
    timestamp: new Date().toISOString()
  };
};

// Inicialización automática mejorada
let cleanupFunction = null;

const initialize = async () => {
  try {
    log('🚀 Iniciando inicialización automática...');
    
    const success = await initializeFirestoreConnection();
    
    if (success) {
      cleanupFunction = startConnectionMonitor();
      log('📋 Inicialización completada:', {
        project: firebaseConfig.projectId,
        state: connectionState,
        emulator: isEmulatorMode
      });
    } else {
      log('⚠️ Inicialización falló, reintentando en 5 segundos...');
      setTimeout(initialize, 5000);
    }
  } catch (error) {
    log('❌ Error en inicialización automática:', error);
    setTimeout(initialize, 5000);
  }
};

// Inicializar una sola vez al cargar el módulo
initialize().catch(error => {
  log('❌ Error crítico en inicialización:', error);
});

// Manejar beforeunload para limpieza
window.addEventListener('beforeunload', () => {
  if (cleanupFunction) {
    cleanupFunction();
  }
});

// Exportar instancias y funciones principales
export { db, app };
export default db;

// Exportar función de limpieza total
export const cleanupAll = () => {
  log('🧹 Ejecutando limpieza total...');
  if (cleanupFunction) {
    cleanupFunction();
    cleanupFunction = null;
  }
  return cleanup();
};

// Exportar funciones de utilidad (nombres únicos)
export const reinitialize = reinitializeConnection;
export { getPerformanceMetrics, initializeFirestoreConnection };