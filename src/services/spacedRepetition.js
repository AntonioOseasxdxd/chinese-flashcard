// src/services/spacedRepetition.js - VERSIÓN CORREGIDA

export class SpacedRepetition {
  /**
   * Calcula el próximo intervalo de revisión basado en el algoritmo SM-2
   * @param {number} repetitions - Número de repeticiones exitosas
   * @param {number} easeFactor - Factor de facilidad (2.5 por defecto)
   * @param {number} quality - Calidad de la respuesta (0-5)
   * @returns {Object} - Nuevo intervalo, repeticiones y factor de facilidad
   */
  static calculateNextReview(repetitions = 0, easeFactor = 2.5, quality = 3) {
    let newInterval = 1;
    let newRepetitions = repetitions;
    let newEaseFactor = easeFactor;

    // Ajustar el factor de facilidad basado en la calidad de la respuesta
    newEaseFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    // Si la calidad es menor a 3, reiniciar las repeticiones
    if (quality < 3) {
      newRepetitions = 0;
      newInterval = 1;
    } else {
      newRepetitions = repetitions + 1;

      // 🔧 CORRECCIÓN: Calcular el intervalo correctamente
      if (newRepetitions === 1) {
        newInterval = 1;
      } else if (newRepetitions === 2) {
        newInterval = 6;
      } else {
        // 🔧 FIX: Usar el intervalo anterior real, no el inicial
        const previousInterval = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(6 * Math.pow(newEaseFactor, newRepetitions - 2));
        newInterval = Math.round(previousInterval * newEaseFactor);
      }
    }

    return {
      interval: newInterval,
      repetitions: newRepetitions,
      easeFactor: newEaseFactor
    };
  }

  /**
   * 🆕 NUEVA FUNCIÓN: Calcula intervalo mejorado con historial
   * @param {Object} cardProgress - Progreso actual de la carta
   * @param {number} quality - Calidad de la respuesta (0-5)
   * @returns {Object} - Nuevo progreso calculado
   */
  static calculateNextReviewImproved(cardProgress = {}, quality = 3) {
    const currentRepetitions = cardProgress.repetitions || 0;
    const currentEaseFactor = cardProgress.easeFactor || 2.5;
    const currentInterval = cardProgress.interval || 1;

    let newInterval = 1;
    let newRepetitions = currentRepetitions;
    let newEaseFactor = currentEaseFactor;

    // Ajustar el factor de facilidad basado en la calidad de la respuesta
    newEaseFactor = Math.max(1.3, currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    // Si la calidad es menor a 3, reiniciar las repeticiones
    if (quality < 3) {
      newRepetitions = 0;
      newInterval = 1;
    } else {
      newRepetitions = currentRepetitions + 1;

      // Calcular el intervalo usando el historial real
      if (newRepetitions === 1) {
        newInterval = 1;
      } else if (newRepetitions === 2) {
        newInterval = 6;
      } else {
        // Usar el intervalo anterior real de la tarjeta
        newInterval = Math.round(currentInterval * newEaseFactor);
      }
    }

    return {
      interval: newInterval,
      repetitions: newRepetitions,
      easeFactor: newEaseFactor,
      lastReviewed: new Date(),
      nextReview: this.getNextReviewDate(newInterval),
      isNew: false
    };
  }

  /**
   * Obtiene las cartas que necesitan ser revisadas
   * @param {Array} cards - Array de cartas
   * @param {Object} userProgress - Progreso del usuario
   * @returns {Array} - Cartas que necesitan revisión
   */
  static getCardsForReview(cards, userProgress = {}) {
    const now = new Date();
    
    return cards.filter(card => {
      const progress = userProgress[card.id];
      
      // Si no hay progreso, es una carta nueva
      if (!progress) {
        return true;
      }

      // Si hay una fecha de próxima revisión, verificar si es tiempo de revisar
      if (progress.nextReview) {
        const nextReview = new Date(progress.nextReview);
        return now >= nextReview;
      }

      // Por defecto, incluir en la revisión
      return true;
    });
  }

  /**
   * Calcula la próxima fecha de revisión
   * @param {number} intervalDays - Días hasta la próxima revisión
   * @returns {Date} - Fecha de la próxima revisión
   */
  static getNextReviewDate(intervalDays) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);
    return nextDate;
  }

  /**
   * 🔧 CORREGIDA: Actualiza el progreso de una carta después de la revisión
   * @param {Object} cardProgress - Progreso actual de la carta
   * @param {number} quality - Calidad de la respuesta (0-5)
   * @returns {Object} - Nuevo progreso de la carta
   */
  static updateCardProgress(cardProgress = {}, quality) {
    // 🔧 FIX: Usar la función mejorada que maneja correctamente el historial
    return this.calculateNextReviewImproved(cardProgress, quality);
  }

  /**
   * Convierte una calificación de usuario a calidad SM-2
   * @param {string} userRating - 'easy', 'good', 'hard', 'again'
   * @returns {number} - Calidad en escala 0-5
   */
  static userRatingToQuality(userRating) {
    const ratingMap = {
      'again': 0,   // Muy difícil
      'hard': 2,    // Difícil
      'good': 3,    // Bien
      'easy': 5     // Fácil
    };

    return ratingMap[userRating] || 3;
  }

  /**
   * 🆕 NUEVA: Convierte boolean a calidad SM-2 (para compatibilidad)
   * @param {boolean} correct - Si la respuesta fue correcta
   * @param {string} difficulty - Dificultad percibida ('easy', 'hard', etc.)
   * @returns {number} - Calidad en escala 0-5
   */
  static booleanToQuality(correct, difficulty = null) {
    if (!correct) return 0; // Incorrect = quality 0
    
    if (difficulty) {
      return this.userRatingToQuality(difficulty);
    }
    
    return 3; // Default to "good" quality
  }

  /**
   * Obtiene estadísticas de aprendizaje
   * @param {Array} cards - Array de cartas
   * @param {Object} userProgress - Progreso del usuario
   * @returns {Object} - Estadísticas de aprendizaje
   */
  static getLearningStats(cards, userProgress = {}) {
    const stats = {
      total: cards.length,
      new: 0,
      learning: 0,
      review: 0,
      mastered: 0,
      overdue: 0 // 🆕 NUEVA estadística
    };

    const now = new Date();

    cards.forEach(card => {
      const progress = userProgress[card.id];
      
      if (!progress || progress.isNew !== false) {
        stats.new++;
      } else if (progress.repetitions === 0) {
        stats.learning++;
      } else if (progress.repetitions < 3) {
        stats.review++;
        
        // 🆕 Verificar si está vencida
        if (progress.nextReview && new Date(progress.nextReview) < now) {
          stats.overdue++;
        }
      } else {
        stats.mastered++;
      }
    });

    return stats;
  }

  /**
   * 🆕 NUEVA: Obtiene métricas detalladas de rendimiento
   * @param {Array} cards - Array de cartas  
   * @param {Object} userProgress - Progreso del usuario
   * @returns {Object} - Métricas detalladas
   */
  static getDetailedMetrics(cards, userProgress = {}) {
    const metrics = {
      totalCards: cards.length,
      totalReviews: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      accuracy: 0,
      averageEaseFactor: 0,
      averageInterval: 0,
      cardsPerDifficulty: {
        easy: 0,
        medium: 0,
        hard: 0
      },
      progressDistribution: this.getLearningStats(cards, userProgress)
    };

    let totalEaseFactor = 0;
    let totalInterval = 0;
    let cardsWithProgress = 0;

    cards.forEach(card => {
      const progress = userProgress[card.id];
      
      // Contar por dificultad
      if (card.difficulty) {
        metrics.cardsPerDifficulty[card.difficulty] = 
          (metrics.cardsPerDifficulty[card.difficulty] || 0) + 1;
      }
      
      if (progress) {
        metrics.totalReviews += progress.reviewCount || 0;
        metrics.correctAnswers += progress.correct || 0;
        metrics.incorrectAnswers += progress.incorrect || 0;
        
        if (progress.easeFactor) {
          totalEaseFactor += progress.easeFactor;
          cardsWithProgress++;
        }
        
        if (progress.interval) {
          totalInterval += progress.interval;
        }
      }
    });

    // Calcular promedios
    if (metrics.totalReviews > 0) {
      metrics.accuracy = (metrics.correctAnswers / (metrics.correctAnswers + metrics.incorrectAnswers)) * 100;
    }
    
    if (cardsWithProgress > 0) {
      metrics.averageEaseFactor = totalEaseFactor / cardsWithProgress;
      metrics.averageInterval = totalInterval / cardsWithProgress;
    }

    return metrics;
  }
}

export default SpacedRepetition;