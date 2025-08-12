// src/hooks/useFlashcards.js - EJEMPLO DE INTEGRACIÓN CORREGIDA
import { useState, useEffect, useCallback } from 'react';
import { useDecks } from './useDecks';
import { SpacedRepetition } from '../services/spacedRepetition';
import { OfflineStorage } from '../services/offlineStorage';
import { FirebaseSync } from '../services/firebaseSync';

export const useFlashcards = () => {
  // Estados principales
  const [cards, setCards] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Usar hook de mazos
  const {
    decks,
    currentDeck,
    loading: decksLoading,
    addDeck,
    updateDeck,
    deleteDeck,
    switchDeck,
    getDeckById,
    getDecksWithStats
  } = useDecks();

  // Monitorear estado de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Cargar tarjetas y progreso
      const [loadedCards, loadedProgress] = await Promise.all([
        loadCards(),
        loadProgress()
      ]);

      setCards(loadedCards || []);
      setProgress(loadedProgress || {});
    } catch (error) {
      console.error('Error loading initial data:', error);
      setCards([]);
      setProgress({});
    } finally {
      setLoading(false);
    }
  };

  const loadCards = async () => {
    try {
      // Intentar cargar desde Firebase primero si está online
      if (isOnline) {
        const firebaseCards = await FirebaseSync.getCards();
        if (firebaseCards && firebaseCards.length > 0) {
          await OfflineStorage.saveCards(firebaseCards);
          return firebaseCards;
        }
      }

      // Cargar desde almacenamiento local
      return await OfflineStorage.getCards();
    } catch (error) {
      console.error('Error loading cards:', error);
      return [];
    }
  };

  const loadProgress = async () => {
    try {
      // Intentar cargar desde Firebase primero si está online
      if (isOnline) {
        const firebaseProgress = await FirebaseSync.getProgress();
        if (firebaseProgress) {
          await OfflineStorage.saveProgress(firebaseProgress);
          return firebaseProgress;
        }
      }

      // Cargar desde almacenamiento local
      return await OfflineStorage.getProgress();
    } catch (error) {
      console.error('Error loading progress:', error);
      return {};
    }
  };

  // Funciones CRUD para tarjetas
  const addCard = useCallback(async (newCard) => {
    try {
      const cardWithId = {
        ...newCard,
        id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        lastReviewed: null,
        nextReview: new Date().toISOString(),
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        isNew: true
      };

      const updatedCards = [...cards, cardWithId];
      setCards(updatedCards);

      // Guardar localmente
      await OfflineStorage.saveCards(updatedCards);

      // Sincronizar con Firebase si está online
      if (isOnline) {
        try {
          await FirebaseSync.syncCards(updatedCards);
        } catch (error) {
          console.warn('Failed to sync with Firebase:', error);
        }
      }

      return cardWithId;
    } catch (error) {
      console.error('Error adding card:', error);
      throw error;
    }
  }, [cards, isOnline]);

  const updateCard = useCallback(async (cardId, updates) => {
    try {
      const updatedCards = cards.map(card =>
        card.id === cardId
          ? { ...card, ...updates, updatedAt: new Date().toISOString() }
          : card
      );

      setCards(updatedCards);

      // Guardar localmente
      await OfflineStorage.saveCards(updatedCards);

      // Sincronizar con Firebase si está online
      if (isOnline) {
        try {
          await FirebaseSync.syncCards(updatedCards);
        } catch (error) {
          console.warn('Failed to sync with Firebase:', error);
        }
      }

      return updatedCards.find(card => card.id === cardId);
    } catch (error) {
      console.error('Error updating card:', error);
      throw error;
    }
  }, [cards, isOnline]);

  const deleteCard = useCallback(async (cardId) => {
    try {
      const updatedCards = cards.filter(card => card.id !== cardId);
      setCards(updatedCards);

      // Guardar localmente
      await OfflineStorage.saveCards(updatedCards);

      // Sincronizar con Firebase si está online
      if (isOnline) {
        try {
          await FirebaseSync.syncCards(updatedCards);
        } catch (error) {
          console.warn('Failed to sync with Firebase:', error);
        }
      }

      return true;
    } catch (error) {
      console.error('Error deleting card:', error);
      throw error;
    }
  }, [cards, isOnline]);

  // Funciones de progreso
  const updateProgress = useCallback(async (cardId, progressData) => {
    try {
      const updatedProgress = {
        ...progress,
        [cardId]: {
          ...progress[cardId],
          ...progressData,
          lastUpdated: new Date().toISOString()
        }
      };

      setProgress(updatedProgress);

      // Guardar localmente
      await OfflineStorage.saveProgress(updatedProgress);

      // Sincronizar con Firebase si está online
      if (isOnline) {
        try {
          await FirebaseSync.syncProgress(updatedProgress);
        } catch (error) {
          console.warn('Failed to sync progress with Firebase:', error);
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }, [progress, isOnline]);

  const markCardReviewed = useCallback(async (cardId, correct = true, difficulty = null) => {
    try {
      const card = cards.find(c => c.id === cardId);
      if (!card) return;

      const currentProgress = progress[cardId] || { correct: 0, incorrect: 0, reviewCount: 0 };
      
      // Usar SpacedRepetition para calcular el nuevo intervalo
      const spaceData = SpacedRepetition.calculateNextReview(
        card,
        currentProgress,
        correct,
        difficulty
      );

      const updatedProgressData = {
        ...currentProgress,
        correct: currentProgress.correct + (correct ? 1 : 0),
        incorrect: currentProgress.incorrect + (correct ? 0 : 1),
        reviewCount: currentProgress.reviewCount + 1,
        lastReviewed: new Date().toISOString(),
        ...spaceData
      };

      await updateProgress(cardId, updatedProgressData);

      // También actualizar la tarjeta con los nuevos datos
      await updateCard(cardId, {
        lastReviewed: new Date().toISOString(),
        nextReview: spaceData.nextReview,
        interval: spaceData.interval,
        easeFactor: spaceData.easeFactor,
        repetitions: spaceData.repetitions,
        isNew: false
      });

    } catch (error) {
      console.error('Error marking card as reviewed:', error);
      throw error;
    }
  }, [cards, progress, updateProgress, updateCard]);

  // Funciones de utilidad
  const getCurrentDeckCards = useCallback(() => {
    if (!currentDeck) return cards;
    return cards.filter(card => card.deckId === currentDeck.id);
  }, [cards, currentDeck]);

  const getCardsForReview = useCallback((deckId = null) => {
    const targetCards = deckId 
      ? cards.filter(card => card.deckId === deckId)
      : getCurrentDeckCards();

    return SpacedRepetition.getCardsForReview(targetCards, progress);
  }, [cards, progress, getCurrentDeckCards]);

  const getStats = useCallback(() => {
    const targetCards = getCurrentDeckCards();
    return SpacedRepetition.getLearningStats(targetCards, progress);
  }, [getCurrentDeckCards, progress]);

  const getGlobalStats = useCallback(() => {
    return SpacedRepetition.getLearningStats(cards, progress);
  }, [cards, progress]);

  const getCardsByCategory = useCallback(() => {
    // Implementar lógica de categorización si es necesaria
    return {
      easy: cards.filter(card => card.difficulty === 'easy'),
      medium: cards.filter(card => card.difficulty === 'medium'),
      hard: cards.filter(card => card.difficulty === 'hard')
    };
  }, [cards]);

  // Función de sincronización manual
  const syncWithFirebase = useCallback(async () => {
    if (!isOnline) return;
    
    setSyncing(true);
    try {
      await Promise.all([
        FirebaseSync.syncCards(cards),
        FirebaseSync.syncProgress(progress)
      ]);
    } catch (error) {
      console.error('Error syncing with Firebase:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [cards, progress, isOnline]);

  // Funciones de manejo de mazos (para compatibilidad con CardManager)
  const moveCardToDeck = useCallback(async (cardId, deckId) => {
    const targetDeck = getDeckById(deckId);
    if (!targetDeck) {
      throw new Error('Deck not found');
    }

    await updateCard(cardId, {
      deckId: deckId,
      deckName: targetDeck.name
    });
  }, [updateCard, getDeckById]);

  const deleteCardsFromDeck = useCallback(async (deckId) => {
    const deckCards = cards.filter(card => card.deckId === deckId);
    await Promise.all(deckCards.map(card => deleteCard(card.id)));
  }, [cards, deleteCard]);

  return {
    // Estados
    cards,
    progress,
    loading: loading || decksLoading,
    syncing,
    isOnline,

    // Estados de mazos
    decks,
    currentDeck,

    // Acciones de cartas
    addCard,
    updateCard,
    deleteCard,
    updateProgress,
    markCardReviewed,
    moveCardToDeck,
    deleteCardsFromDeck,

    // Acciones de mazos
    addDeck,
    updateDeck,
    deleteDeck,
    switchDeck,

    // Utilidades
    getCardsByCategory,
    getCurrentDeckCards,
    getCardsForReview,
    getStats,
    getGlobalStats,
    getDeckById,
    getDecksWithStats,
    
    // Sincronización
    syncWithFirebase
  };
};