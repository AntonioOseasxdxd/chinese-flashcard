// src/hooks/useFlashcards.js - INTEGRACIÓN CORREGIDA
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

  // 🔧 FUNCIÓN CORREGIDA: markCardReviewed
  const markCardReviewed = useCallback(async (cardId, correct = true, difficulty = null) => {
    try {
      const card = cards.find(c => c.id === cardId);
      if (!card) {
        console.error(`Card not found: ${cardId}`);
        return;
      }

      const currentProgress = progress[cardId] || { 
        correct: 0, 
        incorrect: 0, 
        reviewCount: 0,
        repetitions: 0,
        easeFactor: 2.5,
        interval: 1
      };
      
      // 🔧 FIX: Usar la función correcta con parámetros apropiados
      const quality = difficulty 
        ? SpacedRepetition.userRatingToQuality(difficulty)
        : SpacedRepetition.booleanToQuality(correct);

      // 🔧 FIX: Usar updateCardProgress con el progreso actual y calidad
      const spaceData = SpacedRepetition.updateCardProgress(currentProgress, quality);

      const updatedProgressData = {
        ...currentProgress,
        correct: currentProgress.correct + (correct ? 1 : 0),
        incorrect: currentProgress.incorrect + (correct ? 0 : 1),
        reviewCount: currentProgress.reviewCount + 1,
        lastReviewed: new Date().toISOString(),
        ...spaceData // Esto incluye interval, repetitions, easeFactor, nextReview
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

      console.log(`Card ${cardId} reviewed:`, {
        correct,
        difficulty,
        quality,
        newInterval: spaceData.interval,
        newRepetitions: spaceData.repetitions,
        nextReview: spaceData.nextReview
      });

    } catch (error) {
      console.error('Error marking card as reviewed:', error);
      throw error;
    }
  }, [cards, progress, updateProgress, updateCard]);

  // 🆕 NUEVA FUNCIÓN: markCardReviewedAdvanced para más control
  const markCardReviewedAdvanced = useCallback(async (cardId, userRating) => {
    try {
      const card = cards.find(c => c.id === cardId);
      if (!card) {
        console.error(`Card not found: ${cardId}`);
        return;
      }

      const currentProgress = progress[cardId] || { 
        correct: 0, 
        incorrect: 0, 
        reviewCount: 0,
        repetitions: 0,
        easeFactor: 2.5,
        interval: 1
      };
      
      // Convertir rating del usuario a calidad SM-2
      const quality = SpacedRepetition.userRatingToQuality(userRating);
      const isCorrect = quality >= 3; // 3 o más se considera correcto

      // Calcular nuevo progreso usando spaced repetition
      const spaceData = SpacedRepetition.updateCardProgress(currentProgress, quality);

      const updatedProgressData = {
        ...currentProgress,
        correct: currentProgress.correct + (isCorrect ? 1 : 0),
        incorrect: currentProgress.incorrect + (isCorrect ? 0 : 1),
        reviewCount: currentProgress.reviewCount + 1,
        lastReviewed: new Date().toISOString(),
        lastRating: userRating,
        lastQuality: quality,
        ...spaceData
      };

      await updateProgress(cardId, updatedProgressData);

      // Actualizar tarjeta
      await updateCard(cardId, {
        lastReviewed: new Date().toISOString(),
        nextReview: spaceData.nextReview,
        interval: spaceData.interval,
        easeFactor: spaceData.easeFactor,
        repetitions: spaceData.repetitions,
        isNew: false
      });

      console.log(`Card ${cardId} reviewed with rating "${userRating}":`, {
        quality,
        isCorrect,
        newInterval: spaceData.interval,
        newRepetitions: spaceData.repetitions,
        nextReview: spaceData.nextReview
      });

      return {
        success: true,
        quality,
        isCorrect,
        newInterval: spaceData.interval,
        nextReview: spaceData.nextReview
      };

    } catch (error) {
      console.error('Error marking card as reviewed (advanced):', error);
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

  // 🆕 NUEVA FUNCIÓN: getDetailedMetrics
  const getDetailedMetrics = useCallback((deckId = null) => {
    const targetCards = deckId 
      ? cards.filter(card => card.deckId === deckId)
      : getCurrentDeckCards();
    
    return SpacedRepetition.getDetailedMetrics(targetCards, progress);
  }, [cards, progress, getCurrentDeckCards]);

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

  // 🆕 NUEVA FUNCIÓN: resetCardProgress (para casos especiales)
  const resetCardProgress = useCallback(async (cardId) => {
    try {
      const card = cards.find(c => c.id === cardId);
      if (!card) {
        throw new Error('Card not found');
      }

      // Resetear progreso
      const resetProgress = {
        correct: 0,
        incorrect: 0,
        reviewCount: 0,
        repetitions: 0,
        easeFactor: 2.5,
        interval: 1,
        lastReviewed: null,
        nextReview: new Date().toISOString(),
        isNew: true,
        resetAt: new Date().toISOString()
      };

      await updateProgress(cardId, resetProgress);
      await updateCard(cardId, {
        lastReviewed: null,
        nextReview: new Date().toISOString(),
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        isNew: true
      });

      console.log(`Progress reset for card ${cardId}`);
      return true;
    } catch (error) {
      console.error('Error resetting card progress:', error);
      throw error;
    }
  }, [cards, updateProgress, updateCard]);

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
    markCardReviewedAdvanced, // 🆕 NUEVA
    resetCardProgress, // 🆕 NUEVA
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
    getDetailedMetrics, // 🆕 NUEVA
    getDeckById,
    getDecksWithStats,
    
    // Sincronización
    syncWithFirebase
  };
};