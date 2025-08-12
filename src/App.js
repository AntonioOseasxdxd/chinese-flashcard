// src/App.js - Actualizado para incluir editar y eliminar mazos
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Components
import Header from './components/Header';
import Navigation from './components/Navigation';
import CardManager from './components/CardManager';
import DataInitializer from './components/DataInitializer';
import ClearDataButton from './components/ClearDataButton';

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
  const [showClearData, setShowClearData] = useState(false);
  const [showDeckManager, setShowDeckManager] = useState(false);

  // Usar el hook de Firebase con manejo defensivo
  const hookData = useFlashcards();

  // Extraer datos con valores por defecto seguros
  const {
    cards = [],
    progress: userProgress = {},
    loading = false,
    syncing = false,
    isOnline = false,
    
    // Estados de mazos con valores por defecto
    decks = [],
    currentDeck = null,
    
    // Acciones de cartas con funciones por defecto
    addCard = async () => {
      console.warn('addCard function not available');
      return null;
    },
    updateCard = async () => {
      console.warn('updateCard function not available');
    },
    deleteCard = async () => {
      console.warn('deleteCard function not available');
    },
    updateProgress: updateUserProgress = async () => {},
    markCardReviewed = async () => {},
    moveCardToDeck = async () => {},
    deleteCardsFromDeck = async () => {},
    syncWithFirebase = async () => {},
    
    // Acciones de mazos con funciones por defecto
    addDeck = async () => {
      console.warn('addDeck function not available');
      return null;
    },
    updateDeck = async () => {
      console.warn('updateDeck function not available');
    },
    deleteDeck = async () => {
      console.warn('deleteDeck function not available');
    },
    switchDeck = async () => {
      console.warn('switchDeck function not available');
    },
    
    // Utilidades con funciones por defecto
    getCardsByCategory = () => [],
    getCurrentDeckCards = () => [],
    getCardsForReview = () => [],
    getStats = () => ({
      totalCards: 0,
      reviewedCards: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      accuracy: 0,
      cardsForReview: 0,
      currentDeck: 'Todos los mazos'
    }),
    getGlobalStats = () => ({
      totalCards: 0,
      reviewedCards: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      accuracy: 0,
      totalDecks: 0,
      cardsForReview: 0
    }),
    getDeckById = () => null,
    getDecksWithStats = () => []
  } = hookData || {};

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

  // Manejar cambio de mazo
  const handleDeckChange = async (deck) => {
    try {
      await switchDeck(deck);
      console.log('Switched to deck:', deck?.name || 'Unknown');
    } catch (error) {
      console.error('Error switching deck:', error);
    }
  };

  // Manejar creación de mazo - FUNCIÓN CORREGIDA
  const handleCreateDeck = async (deckData) => {
    try {
      const createdDeck = await addDeck(deckData);
      console.log('Deck created:', deckData?.name || 'Unknown');
      setShowDeckManager(false);
      return createdDeck; // Importante: devolver el mazo creado
    } catch (error) {
      console.error('Error creating deck:', error);
      throw error; // Re-lanzar el error para que CardManager lo maneje
    }
  };

  // NUEVA FUNCIÓN: Manejar edición de mazo
  const handleEditDeck = async (deckId, deckData) => {
    try {
      const updatedDeck = await updateDeck(deckId, deckData);
      console.log('Deck updated:', deckData?.name || 'Unknown');
      return updatedDeck;
    } catch (error) {
      console.error('Error updating deck:', error);
      throw error; // Re-lanzar el error para que CardManager lo maneje
    }
  };

  // NUEVA FUNCIÓN: Manejar eliminación de mazo
  const handleDeleteDeck = async (deckId) => {
    try {
      // Obtener información del mazo antes de eliminarlo
      const deckToDelete = decks.find(deck => deck.id === deckId);
      const deckCards = cards.filter(card => card.deckId === deckId);
      
      // Eliminar todas las tarjetas del mazo primero si las hay
      if (deckCards.length > 0) {
        for (const card of deckCards) {
          await deleteCard(card.id);
        }
      }
      
      // Eliminar el mazo
      await deleteDeck(deckId);
      console.log('Deck and its cards deleted:', deckToDelete?.name || 'Unknown');
      
      return true;
    } catch (error) {
      console.error('Error deleting deck:', error);
      throw error; // Re-lanzar el error para que CardManager lo maneje
    }
  };

  // Manejar mover carta a mazo
  const handleMoveCardToDeck = async (cardId, deckId) => {
    try {
      await moveCardToDeck(cardId, deckId);
      console.log(`Card ${cardId} moved to deck ${deckId}`);
    } catch (error) {
      console.error('Error moving card to deck:', error);
    }
  };

  // Manejar limpieza de datos
  const handleDataCleared = () => {
    console.log('All data cleared!');
    setShowClearData(false);
    // La página se recargará automáticamente
  };

  // Obtener estadísticas y datos actuales de forma segura
  const getSafeStats = () => {
    try {
      return currentDeck ? getStats() : getGlobalStats();
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalCards: 0,
        reviewedCards: 0,
        correctAnswers: 0,
        totalAnswers: 0,
        accuracy: 0,
        cardsForReview: 0,
        currentDeck: 'Error'
      };
    }
  };

  const getSafeCurrentCards = () => {
    try {
      if (currentDeck) {
        const deckCards = getCurrentDeckCards();
        return Array.isArray(deckCards) ? deckCards : [];
      }
      return Array.isArray(cards) ? cards : [];
    } catch (error) {
      console.error('Error getting current cards:', error);
      return [];
    }
  };

  const getSafeReviewCards = () => {
    try {
      if (currentDeck) {
        const reviewCards = getCardsForReview(currentDeck.id);
        return Array.isArray(reviewCards) ? reviewCards : [];
      }
      const reviewCards = getCardsForReview();
      return Array.isArray(reviewCards) ? reviewCards : [];
    } catch (error) {
      console.error('Error getting review cards:', error);
      return [];
    }
  };

  // Calcular datos actuales de forma segura
  const currentStats = getSafeStats();
  const currentCards = getSafeCurrentCards();
  const reviewCards = getSafeReviewCards();

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
              {currentDeck ? (
                <>📂 {currentDeck.name} • 📚 {currentCards.length} cartas • 🎯 {reviewCards.length} pendientes</>
              ) : (
                <>📚 {cards.length} cartas • 🎯 {reviewCards.length} pendientes</>
              )}
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

        {/* Mostrar limpiador de datos si está activado */}
        {showClearData && (
          <ClearDataButton onDataCleared={handleDataCleared} />
        )}

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  cards={currentCards}
                  userProgress={userProgress}
                  settings={settings}
                  stats={currentStats}
                  cardsForReview={reviewCards}
                  currentDeck={currentDeck}
                  decks={decks}
                />
              }
            />
            <Route
              path="/practice"
              element={
                <Practice
                  // Props originales
                  cards={cards} // Pasar TODAS las cartas para que Practice pueda filtrar por mazo
                  userProgress={userProgress}
                  updateProgress={handleUpdateProgress}
                  markCardReviewed={handleMarkCardReviewed}
                  settings={settings}
                  cardsForReview={reviewCards}
                  currentDeck={currentDeck}
                  // Nuevas props para mazos
                  decks={decks}
                />
              }
            />
            <Route
              path="/progress"
              element={
                <Progress
                  cards={currentCards}
                  userProgress={userProgress}
                  stats={currentStats}
                  getCardsByCategory={getCardsByCategory}
                  currentDeck={currentDeck}
                  decks={decks}
                  globalStats={getGlobalStats()}
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
                  stats={currentStats}
                  globalStats={getGlobalStats()}
                  currentDeck={currentDeck}
                />
              } 
            />
            <Route
              path="/cards"
              element={
                <CardManager
                  cards={Array.isArray(cards) ? cards : []}
                  onAddCard={async (newCard) => {
                    try {
                      return await addCard(newCard);
                    } catch (error) {
                      console.error('Error adding card:', error);
                      throw error;
                    }
                  }}
                  onDeleteCard={async (cardId) => {
                    try {
                      return await deleteCard(cardId);
                    } catch (error) {
                      console.error('Error deleting card:', error);
                      throw error;
                    }
                  }}
                  onEditCard={async (updatedCard) => {
                    try {
                      return await updateCard(updatedCard.id, updatedCard);
                    } catch (error) {
                      console.error('Error updating card:', error);
                      throw error;
                    }
                  }}
                  // PROPS PARA SISTEMA DE MAZOS
                  decks={Array.isArray(decks) ? decks : []}
                  currentDeck={currentDeck}
                  onAddDeck={handleCreateDeck}
                  onSwitchDeck={handleDeckChange}
                  onEditDeck={handleEditDeck}    // ✅ NUEVA PROP AGREGADA
                  onDeleteDeck={handleDeleteDeck} // ✅ NUEVA PROP AGREGADA
                  loading={loading}
                  // Props adicionales
                  onMoveCardToDeck={handleMoveCardToDeck}
                  isOnline={isOnline}
                  syncing={syncing}
                  userProgress={userProgress}
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