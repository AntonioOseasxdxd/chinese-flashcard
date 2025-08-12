// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from "firebase/firestore";
// Analytics comentado para evitar problemas con bloqueadores de anuncios
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDHM-P0oVfUv_8vGNODDOaQi4PUfmwhMmE",
  authDomain: "chinese-flashcards-a12f8.firebaseapp.com",
  projectId: "chinese-flashcards-a12f8",
  storageBucket: "chinese-flashcards-a12f8.firebasestorage.app",
  messagingSenderId: "690764775481",
  appId: "1:690764775481:web:019ae3edd13cae27128de8",
  measurementId: "G-QBJY3QNWMV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Configurar persistencia offline de Firestore
// Esto permite que Firestore funcione sin conexión
const initializeFirestore = async () => {
  try {
    // Habilitar persistencia offline
    await enableNetwork(db);
    console.log('🔥 Firebase inicializado correctamente');
    console.log('📊 Firestore conectado con persistencia offline');
    console.log('🌐 Proyecto:', firebaseConfig.projectId);
  } catch (error) {
    console.error('❌ Error al inicializar Firestore:', error);
    
    // Si falla la inicialización, intentar en modo offline
    try {
      await disableNetwork(db);
      console.log('📱 Firestore iniciado en modo offline');
    } catch (offlineError) {
      console.error('❌ Error crítico al inicializar Firestore:', offlineError);
    }
  }
};

// Inicializar cuando se carga el módulo
initializeFirestore();

// Función para verificar el estado de la conexión
export const checkFirestoreConnection = async () => {
  try {
    await enableNetwork(db);
    return true;
  } catch (error) {
    console.log('📡 Firestore offline');
    return false;
  }
};

// Función para forzar modo offline
export const goOffline = async () => {
  try {
    await disableNetwork(db);
    console.log('📱 Firestore cambiado a modo offline');
    return true;
  } catch (error) {
    console.error('❌ Error al cambiar a modo offline:', error);
    return false;
  }
};

// Función para volver online
export const goOnline = async () => {
  try {
    await enableNetwork(db);
    console.log('🌐 Firestore cambiado a modo online');
    return true;
  } catch (error) {
    console.error('❌ Error al cambiar a modo online:', error);
    return false;
  }
};

// Analytics deshabilitado para evitar bloqueos
// const analytics = getAnalytics(app);

// Información de debug
console.log('📋 Configuración Firebase:');
console.log('  - Proyecto ID:', firebaseConfig.projectId);
console.log('  - Auth Domain:', firebaseConfig.authDomain);
console.log('  - Storage Bucket:', firebaseConfig.storageBucket);

export { db, app };
export default db;