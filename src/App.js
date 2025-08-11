// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Components
import Header from './components/Header';
import Navigation from './components/Navigation';
import CardManager from './components/CardManager';
import DataInitializer from './components/DataInitializer';
import ClearDataButton from './components/ClearDataButton'; // NUEVO

// Pages
import Home from './pages/Home';
import Practice from './pages/Practice';
import Progress from './pages/Progress';
import Settings from './pages/Settings';

// Hooks
import { useFlashcards } from './hooks/useFlashcards';

// Services
import { OfflineStorage } from './services/offlineStorage';

function App() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    soundEnabled: true,
    dailyGoal: 20,
    showPinyin: true,
    difficulty: 'medium'
  });
  const [showDataInitializer, setShowDataInitializer] = useState(false);
  const [showClearData, setShowClearData] = useState(false); // NUEVO

  // Usar el hook de Firebase para manejar tarjetas
  const {
    cards,
    progress: userProgress,
    loading,
    syncing,
    isOnline,
    addCard,
    updateCard,
    deleteCard,
    updateProgress: updateUserProgress,
    markCardReviewed,
    syncWithFirebase,
    getCardsByCategory,
    getCardsForReview,
    getStats
  } = useFlashcards();

  // Cargar configuraciones al iniciar
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await OfflineStorage.getSettings();
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...savedSettings }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      // Guardar en almacenamiento local
      await OfflineStorage.saveSettings(updatedSettings);

      console.log('Settings updated:', newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  // Función mejorada para actualizar progreso
  const handleUpdateProgress = async (cardId, progressData) => {
    try {
      await updateUserProgress(cardId, progressData);
      console.log(`Updated progress for card ${cardId}:`, progressData);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Función para marcar carta como revisada con resultado
  const handleMarkCardReviewed = async (cardId, correct = true, difficulty = null) => {
    try {
      await markCardReviewed(cardId, correct, difficulty);
      console.log(`Card ${cardId} marked as ${correct ? 'correct' : 'incorrect'}`);
    } catch (error) {
      console.error('Error marking card as reviewed:', error);
    }
  };

  // Función para manejar sincronización manual
  const handleManualSync = async () => {
    try {
      await syncWithFirebase();
      console.log('Manual sync completed');
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  // NUEVO: Manejar limpieza de datos
  const handleDataCleared = () => {
    console.log('All data cleared!');
    setShowClearData(false);
    // La página se recargará automáticamente
  };

  // Mostrar loading inicial
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px'
        }}>
          🏮
        </div>
        <h2 style={{ color: '#495057', marginBottom: '10px' }}>
          Cargando Chinese Flashcards
        </h2>
        <p style={{ color: '#6c757d' }}>
          Sincronizando tus datos...
        </p>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Header />

        {/* Indicador de estado de conexión y sincronización */}
        <div style={{
          padding: '8px 20px',
          backgroundColor: isOnline ? '#d4edda' : '#f8d7da',
          color: isOnline ? '#155724' : '#721c24',
          fontSize: '12px',
          textAlign: 'center',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            {isOnline ? '🟢 Conectado' : '🔴 Sin conexión'} 
            {syncing && ' • ⏳ Sincronizando...'}
          </span>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px' }}>
              📚 {cards.length} cartas • 🎯 {getStats().cardsForReview} pendientes
            </span>
            
            {isOnline && (
              <button
                onClick={handleManualSync}
                disabled={syncing}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  backgroundColor: 'transparent',
                  border: '1px solid currentColor',
                  borderRadius: '4px',
                  cursor: syncing ? 'not-allowed' : 'pointer',
                  opacity: syncing ? 0.6 : 1
                }}
              >
                {syncing ? '⏳' : '🔄'} Sync
              </button>
            )}
            
            <button
              onClick={() => setShowDataInitializer(!showDataInitializer)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: 'transparent',
                border: '1px solid currentColor',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ⚙️ Config
            </button>

            {/* NUEVO: Botón para mostrar limpiador de datos */}
            <button
              onClick={() => setShowClearData(!showClearData)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: showClearData ? '#dc3545' : 'transparent',
                color: showClearData ? 'white' : 'currentColor',
                border: '1px solid currentColor',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* Mostrar inicializador de datos si está activado */}
        {showDataInitializer && (
          <DataInitializer onInitComplete={() => setShowDataInitializer(false)} />
        )}

        {/* NUEVO: Mostrar limpiador de datos si está activado */}
        {showClearData && (
          <ClearDataButton onDataCleared={handleDataCleared} />
        )}

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  cards={cards}
                  userProgress={userProgress}
                  settings={settings}
                  stats={getStats()}
                  cardsForReview={getCardsForReview()}
                />
              }
            />
            <Route
              path="/practice"
              element={
                <Practice
                  cards={cards}
                  userProgress={userProgress}
                  updateProgress={handleUpdateProgress}
                  markCardReviewed={handleMarkCardReviewed}
                  settings={settings}
                  cardsForReview={getCardsForReview()}
                />
              }
            />
            <Route
              path="/progress"
              element={
                <Progress
                  cards={cards}
                  userProgress={userProgress}
                  stats={getStats()}
                  getCardsByCategory={getCardsByCategory}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <Settings
                  settings={settings}
                  updateSettings={updateSettings}
                  isOnline={isOnline}
                  syncing={syncing}
                  onManualSync={handleManualSync}
                  stats={getStats()}
                />
              } 
            />
            <Route
  path="/cards"
  element={
    <CardManager
      cards={cards}
      onAddCard={(newCard) => addCard(newCard)}
      onDeleteCard={(cardId) => deleteCard(cardId)}
      onEditCard={(updatedCard) => updateCard(updatedCard.id, updatedCard)} // ✅ CORRECTO
      isOnline={isOnline}
      syncing={syncing}
    />
  }
/>
          </Routes>
        </main>

        <Navigation />
      </div>
    </Router>
  );
}

export default App;