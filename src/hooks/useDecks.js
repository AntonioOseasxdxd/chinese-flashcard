// src/hooks/useDecks.js
import { useState, useEffect, useCallback } from 'react';
import { FirebaseSync } from '../services/firebaseSync';
import { OfflineStorage } from '../services/offlineStorage';

export const useDecks = () => {
  const [decks, setDecks] = useState([]);
  const [currentDeck, setCurrentDeck] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar mazos iniciales
  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    setLoading(true);
    try {
      // Intentar cargar desde Firebase primero
      let loadedDecks = await FirebaseSync.getDecks();
      
      if (!loadedDecks || loadedDecks.length === 0) {
        // Si no hay mazos en Firebase, cargar desde almacenamiento local
        loadedDecks = await OfflineStorage.getDecks();
      }

      if (!loadedDecks || loadedDecks.length === 0) {
        // Si no hay mazos, crear el mazo por defecto
        const defaultDeck = createDefaultDeck();
        loadedDecks = [defaultDeck];
        await saveDecks([defaultDeck]);
      }

      setDecks(loadedDecks);
      
      // Establecer mazo actual (el primero si no hay uno seleccionado)
      const savedCurrentDeck = await OfflineStorage.getCurrentDeck();
      if (savedCurrentDeck && loadedDecks.find(d => d.id === savedCurrentDeck.id)) {
        setCurrentDeck(savedCurrentDeck);
      } else {
        setCurrentDeck(loadedDecks[0]);
      }

    } catch (error) {
      console.error('Error loading decks:', error);
      // Crear mazo por defecto en caso de error
      const defaultDeck = createDefaultDeck();
      setDecks([defaultDeck]);
      setCurrentDeck(defaultDeck);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultDeck = () => ({
    id: 'default',
    name: '📚 Mazo Principal',
    description: 'Mazo predeterminado para tus flashcards',
    color: '#007bff',
    icon: '📚',
    createdAt: new Date().toISOString(),
    cardCount: 0
  });

  const saveDecks = async (decksToSave) => {
    try {
      // Guardar en Firebase si está online
      if (navigator.onLine) {
        await FirebaseSync.syncDecks(decksToSave);
      }
      
      // Siempre guardar localmente
      await OfflineStorage.saveDecks(decksToSave);
    } catch (error) {
      console.error('Error saving decks:', error);
    }
  };

  const addDeck = useCallback(async (newDeck) => {
    const deckWithId = {
      ...newDeck,
      id: `deck_${Date.now()}`,
      createdAt: new Date().toISOString(),
      cardCount: 0
    };

    const updatedDecks = [...decks, deckWithId];
    setDecks(updatedDecks);
    await saveDecks(updatedDecks);

    return deckWithId;
  }, [decks]);

  const updateDeck = useCallback(async (deckId, updates) => {
    const updatedDecks = decks.map(deck => 
      deck.id === deckId 
        ? { ...deck, ...updates, updatedAt: new Date().toISOString() }
        : deck
    );

    setDecks(updatedDecks);
    await saveDecks(updatedDecks);

    // Si estamos actualizando el mazo actual, actualizarlo también
    if (currentDeck?.id === deckId) {
      const updatedCurrentDeck = updatedDecks.find(d => d.id === deckId);
      setCurrentDeck(updatedCurrentDeck);
      await OfflineStorage.saveCurrentDeck(updatedCurrentDeck);
    }

    return updatedDecks.find(deck => deck.id === deckId);
  }, [decks, currentDeck]);

  const deleteDeck = useCallback(async (deckId) => {
    // No permitir eliminar si es el único mazo
    if (decks.length <= 1) {
      throw new Error('No puedes eliminar el último mazo');
    }

    const updatedDecks = decks.filter(deck => deck.id !== deckId);
    setDecks(updatedDecks);
    await saveDecks(updatedDecks);

    // Si eliminamos el mazo actual, cambiar al primero disponible
    if (currentDeck?.id === deckId) {
      const newCurrentDeck = updatedDecks[0];
      setCurrentDeck(newCurrentDeck);
      await OfflineStorage.saveCurrentDeck(newCurrentDeck);
    }

    return updatedDecks;
  }, [decks, currentDeck]);

  const switchDeck = useCallback(async (deck) => {
    setCurrentDeck(deck);
    await OfflineStorage.saveCurrentDeck(deck);
  }, []);

  const updateDeckCardCount = useCallback(async (deckId, cardCount) => {
    await updateDeck(deckId, { cardCount });
  }, [updateDeck]);

  const getDeckById = useCallback((deckId) => {
    return decks.find(deck => deck.id === deckId);
  }, [decks]);

  const getDecksWithStats = useCallback((cards, progress) => {
    return decks.map(deck => {
      const deckCards = cards.filter(card => card.deckId === deck.id);
      const reviewedCards = deckCards.filter(card => progress[card.id]);
      const correctAnswers = deckCards.reduce((sum, card) => {
        const cardProgress = progress[card.id];
        return sum + (cardProgress?.correct || 0);
      }, 0);
      const totalAnswers = deckCards.reduce((sum, card) => {
        const cardProgress = progress[card.id];
        return sum + (cardProgress?.correct || 0) + (cardProgress?.incorrect || 0);
      }, 0);

      return {
        ...deck,
        cardCount: deckCards.length,
        reviewedCards: reviewedCards.length,
        accuracy: totalAnswers > 0 ? ((correctAnswers / totalAnswers) * 100).toFixed(1) : 0,
        cardsForReview: deckCards.filter(card => {
          if (!card.lastReviewed) return true;
          const lastReview = new Date(card.lastReviewed);
          const daysSinceReview = (new Date() - lastReview) / (1000 * 60 * 60 * 24);
          const reviewInterval = Math.min(30, Math.pow(2, card.reviewCount || 0));
          return daysSinceReview >= reviewInterval;
        }).length
      };
    });
  }, [decks]);

  return {
    // Estado
    decks,
    currentDeck,
    loading,

    // Acciones
    addDeck,
    updateDeck,
    deleteDeck,
    switchDeck,
    updateDeckCardCount,

    // Utilidades
    getDeckById,
    getDecksWithStats,
    
    // Funciones de carga
    loadDecks
  };
};

export default useDecks;