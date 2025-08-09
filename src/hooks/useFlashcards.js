// src/hooks/useFlashcards.js
import { useState, useEffect, useCallback } from 'react';
import { FirebaseSync } from '../services/firebaseSync';
import { OfflineStorage } from '../services/offlineStorage';

export const useFlashcards = () => {
  const [cards, setCards] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // Sincronizar cuando vuelva la conexión
  useEffect(() => {
    if (isOnline) {
      syncWithFirebase();
    }
  }, [isOnline]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Inicializar usuario en Firebase
      await FirebaseSync.initializeUser();

      // Cargar cartas
      const loadedCards = await FirebaseSync.getCards();
      const loadedProgress = await FirebaseSync.getProgress();

      setCards(loadedCards || []);
      setProgress(loadedProgress || {});

      console.log('Initial data loaded:', { 
        cardsCount: loadedCards?.length || 0, 
        progressKeys: Object.keys(loadedProgress || {}).length 
      });
    } catch (error) {
      console.error('Error loading initial data:', error);
      
      // Fallback a datos locales
      const localCards = await OfflineStorage.getCards();
      const localProgress = await OfflineStorage.getProgress();
      
      setCards(localCards || []);
      setProgress(localProgress || {});
    } finally {
      setLoading(false);
    }
  };

  const syncWithFirebase = async () => {
    if (!isOnline) return;
    
    setSyncing(true);
    try {
      const result = await FirebaseSync.forcSync();
      if (result.success) {
        setCards(result.cards || []);
        setProgress(result.progress || {});
        console.log('Sync completed successfully');
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Agregar nueva carta
  const addCard = useCallback(async (newCard) => {
    const cardWithId = {
      ...newCard,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      lastReviewed: null,
      reviewCount: 0,
      difficulty: 'medium'
    };

    const updatedCards = [...cards, cardWithId];
    setCards(updatedCards);

    // Sincronizar con Firebase
    if (isOnline) {
      await FirebaseSync.syncCards(updatedCards);
    } else {
      // Guardar localmente si no hay internet
      await OfflineStorage.saveCards(updatedCards);
    }

    return cardWithId;
  }, [cards, isOnline]);

  // Actualizar carta existente
  const updateCard = useCallback(async (cardId, updates) => {
    const updatedCards = cards.map(card => 
      card.id === cardId 
        ? { ...card, ...updates, updatedAt: new Date().toISOString() }
        : card
    );

    setCards(updatedCards);

    // Sincronizar con Firebase
    if (isOnline) {
      await FirebaseSync.syncCards(updatedCards);
    } else {
      await OfflineStorage.saveCards(updatedCards);
    }

    return updatedCards.find(card => card.id === cardId);
  }, [cards, isOnline]);

  // Eliminar carta
  const deleteCard = useCallback(async (cardId) => {
    const updatedCards = cards.filter(card => card.id !== cardId);
    setCards(updatedCards);

    // Sincronizar con Firebase
    if (isOnline) {
      await FirebaseSync.syncCards(updatedCards);
    } else {
      await OfflineStorage.saveCards(updatedCards);
    }

    // También eliminar progreso de esa carta
    const updatedProgress = { ...progress };
    delete updatedProgress[cardId];
    setProgress(updatedProgress);

    if (isOnline) {
      await FirebaseSync.syncProgress(updatedProgress);
    } else {
      await OfflineStorage.saveProgress(updatedProgress);
    }
  }, [cards, progress, isOnline]);

  // Actualizar progreso de una carta
  const updateProgress = useCallback(async (cardId, progressData) => {
    const updatedProgress = {
      ...progress,
      [cardId]: {
        ...progress[cardId],
        ...progressData,
        lastUpdated: new Date().toISOString()
      }
    };

    setProgress(updatedProgress);

    // Sincronizar con Firebase
    if (isOnline) {
      await FirebaseSync.syncProgress(updatedProgress);
    } else {
      await OfflineStorage.saveProgress(updatedProgress);
    }
  }, [progress, isOnline]);

  // Marcar carta como revisada
  const markCardReviewed = useCallback(async (cardId, correct = true, difficulty = null) => {
    // Actualizar la carta
    await updateCard(cardId, {
      lastReviewed: new Date().toISOString(),
      reviewCount: (cards.find(c => c.id === cardId)?.reviewCount || 0) + 1
    });

    // Actualizar progreso
    const currentProgress = progress[cardId] || { correct: 0, incorrect: 0, streak: 0 };
    
    const newProgress = {
      ...currentProgress,
      correct: currentProgress.correct + (correct ? 1 : 0),
      incorrect: currentProgress.incorrect + (correct ? 0 : 1),
      streak: correct ? (currentProgress.streak || 0) + 1 : 0,
      lastResult: correct,
      difficulty: difficulty || currentProgress.difficulty
    };

    await updateProgress(cardId, newProgress);
  }, [cards, progress, updateCard, updateProgress]);

  // Obtener cartas por categoría
  const getCardsByCategory = useCallback((category) => {
    return cards.filter(card => card.category === category);
  }, [cards]);

  // Obtener cartas que necesitan revisión
  const getCardsForReview = useCallback(() => {
    const now = new Date();
    return cards.filter(card => {
      if (!card.lastReviewed) return true;
      
      const lastReview = new Date(card.lastReviewed);
      const daysSinceReview = (now - lastReview) / (1000 * 60 * 60 * 24);
      
      // Lógica simple de repetición espaciada
      const reviewInterval = Math.min(30, Math.pow(2, card.reviewCount || 0));
      return daysSinceReview >= reviewInterval;
    });
  }, [cards]);

  // Estadísticas
  const getStats = useCallback(() => {
    const totalCards = cards.length;
    const reviewedCards = Object.keys(progress).length;
    const correctAnswers = Object.values(progress).reduce((sum, p) => sum + p.correct, 0);
    const totalAnswers = Object.values(progress).reduce((sum, p) => sum + p.correct + p.incorrect, 0);
    
    return {
      totalCards,
      reviewedCards,
      correctAnswers,
      totalAnswers,
      accuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers * 100).toFixed(1) : 0,
      cardsForReview: getCardsForReview().length
    };
  }, [cards, progress, getCardsForReview]);

  return {
    // Estado
    cards,
    progress,
    loading,
    syncing,
    isOnline,
    
    // Acciones
    addCard,
    updateCard,
    deleteCard,
    updateProgress,
    markCardReviewed,
    syncWithFirebase,
    
    // Utilidades
    getCardsByCategory,
    getCardsForReview,
    getStats
  };
};

export default useFlashcards;