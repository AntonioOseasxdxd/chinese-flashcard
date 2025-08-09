// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Components
import Header from './components/Header';
import Navigation from './components/Navigation';
import CardManager from './components/CardManager'; // Nuevo componente

// Pages
import Home from './pages/Home';
import Practice from './pages/Practice';
import Progress from './pages/Progress';
import Settings from './pages/Settings';

// Services
import { OfflineStorage } from './services/offlineStorage';
import { SpacedRepetition } from './services/spacedRepetition';
import { initialCards } from './data/initialCards';

function App() {
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [settings, setSettings] = useState({
    soundEnabled: true,
    dailyGoal: 20,
    showPinyin: true,
    difficulty: 'medium'
  });

  // Cargar datos al iniciar la app
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      console.log('Loading initial data...');
      
      // Cargar cartas desde almacenamiento local o usar cartas iniciales
      let loadedCards = await OfflineStorage.getCards();
      if (!loadedCards || loadedCards.length === 0) {
        loadedCards = initialCards;
        await OfflineStorage.saveCards(loadedCards);
      }
      setCards(loadedCards);

      // Cargar progreso del usuario
      const progress = await OfflineStorage.getProgress();
      setUserProgress(progress || {});

      // Cargar configuraciones
      const savedSettings = await OfflineStorage.getSettings();
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...savedSettings }));
      }

      console.log(`Loaded ${loadedCards.length} cards`);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const updateUserProgress = async (cardId, progressData) => {
    try {
      // Actualizar progreso en el estado
      const newProgress = {
        ...userProgress,
        [cardId]: {
          ...userProgress[cardId],
          ...progressData
        }
      };
      
      setUserProgress(newProgress);
      
      // Guardar en almacenamiento local
      await OfflineStorage.saveProgress(newProgress);
      
      console.log(`Updated progress for card ${cardId}:`, progressData);
    } catch (error) {
      console.error('Error updating progress:', error);
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

  // NUEVAS FUNCIONES PARA GESTIONAR TARJETAS
  const addCard = async (newCard) => {
    try {
      const updatedCards = [...cards, newCard];
      setCards(updatedCards);
      
      // Guardar en almacenamiento local
      await OfflineStorage.saveCards(updatedCards);
      
      console.log('Card added:', newCard);
    } catch (error) {
      console.error('Error adding card:', error);
    }
  };

  const deleteCard = async (cardId) => {
    try {
      const updatedCards = cards.filter(card => card.id !== cardId);
      setCards(updatedCards);
      
      // También eliminar el progreso de esa carta
      const updatedProgress = { ...userProgress };
      delete updatedProgress[cardId];
      setUserProgress(updatedProgress);
      
      // Guardar en almacenamiento local
      await OfflineStorage.saveCards(updatedCards);
      await OfflineStorage.saveProgress(updatedProgress);
      
      console.log('Card deleted:', cardId);
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  return (
    <Router>
      <div className="app">
        <Header />
        
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={
                <Home 
                  cards={cards}
                  userProgress={userProgress}
                  settings={settings}
                />
              } 
            />
            <Route 
              path="/practice" 
              element={
                <Practice 
                  cards={cards}
                  userProgress={userProgress}
                  updateProgress={updateUserProgress}
                  settings={settings}
                />
              } 
            />
            <Route 
              path="/progress" 
              element={
                <Progress 
                  cards={cards}
                  userProgress={userProgress}
                />
              } 
            />
            <Route 
              path="/settings" 
              element={
                <Settings 
                  settings={settings}
                  updateSettings={updateSettings}
                />
              } 
            />
            {/* NUEVA RUTA PARA GESTIONAR TARJETAS */}
            <Route 
              path="/cards" 
              element={
                <CardManager 
                  cards={cards}
                  onAddCard={addCard}
                  onDeleteCard={deleteCard}
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