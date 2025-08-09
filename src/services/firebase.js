// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
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
const db = getFirestore(app);

// Analytics deshabilitado para evitar bloqueos
// const analytics = getAnalytics(app);

console.log('🔥 Firebase inicializado correctamente');
console.log('📊 Firestore conectado');

export { db };