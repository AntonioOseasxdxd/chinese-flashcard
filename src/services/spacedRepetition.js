// src/services/spacedRepetition.js

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

      // Calcular el intervalo basado en el número de repeticiones
      if (newRepetitions === 1) {
        newInterval = 1;
      } else if (newRepetitions === 2) {
        newInterval = 6;
      } else {
        newInterval = Math.round(newInterval * newEaseFactor);
      }
    }

    return {
      interval: newInterval,
      repetitions: newRepetitions,
      easeFactor: newEaseFactor
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
   * Actualiza el progreso de una carta después de la revisión
   * @param {Object} cardProgress - Progreso actual de la carta
   * @param {number} quality - Calidad de la respuesta (0-5)
   * @returns {Object} - Nuevo progreso de la carta
   */
  static updateCardProgress(cardProgress = {}, quality) {
    const currentRepetitions = cardProgress.repetitions || 0;
    const currentEaseFactor = cardProgress.easeFactor || 2.5;
    const currentInterval = cardProgress.interval || 1;

    const { interval, repetitions, easeFactor } = this.calculateNextReview(
      currentRepetitions,
      currentEaseFactor,
      quality
    );

    return {
      ...cardProgress,
      interval,
      repetitions,
      easeFactor,
      lastReviewed: new Date(),
      nextReview: this.getNextReviewDate(interval),
      isNew: false
    };
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
      mastered: 0
    };

    cards.forEach(card => {
      const progress = userProgress[card.id];
      
      if (!progress || progress.isNew !== false) {
        stats.new++;
      } else if (progress.repetitions === 0) {
        stats.learning++;
      } else if (progress.repetitions < 3) {
        stats.review++;
      } else {
        stats.mastered++;
      }
    });

    return stats;
  }
}

export default SpacedRepetition;