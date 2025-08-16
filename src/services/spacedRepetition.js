// src/services/spacedRepetition.js
// Implementación del sistema de repetición espaciada FSRS de Anki
// Basado en el algoritmo FSRS (Free Spaced Repetition Scheduler)

class FSRSMemoryState {
    constructor(stability = 1.0, difficulty = 5.0) {
        this.stability = stability;
        this.difficulty = difficulty;
    }
}

class FSRSReview {
    constructor(rating, deltaT) {
        this.rating = rating; // 1-4 (Again, Hard, Good, Easy)
        this.deltaT = deltaT; // Days since last review
    }
}

class FSRSItem {
    constructor(reviews = []) {
        this.reviews = reviews;
    }
}

class FSRS {
    constructor(params = null) {
        // Parámetros por defecto de FSRS-6
        this.params = params || [
            0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 
            0.5316, 1.0651, 0.0234, 1.616, 0.1544,
            1.0824, 1.9813, 0.0953, 0.2975, 2.2042,
            0.2407, 2.9466, 0.5034, 0.6567, 0.0001,
            0.5
        ];
        this.decay = this.params[20] || 0.5; // FSRS6_DEFAULT_DECAY
        this.historicalRetention = 0.9;
    }

    // Función de retrievabilidad - núcleo del algoritmo FSRS
    retrievability(elapsedDays, stability) {
        return Math.exp(Math.log(0.9) * elapsedDays / stability);
    }

    // Calcular el próximo intervalo basado en la retención deseada
    nextInterval(stability, desiredRetention = 0.9) {
        if (stability <= 0) return 1;
        return Math.max(1, Math.round(stability * Math.log(desiredRetention) / Math.log(0.9)));
    }

    // Calcular el estado de memoria después de una revisión
    nextStates(memoryState, elapsedDays, rating, desiredRetention = 0.9) {
        if (!memoryState) {
            memoryState = new FSRSMemoryState();
        }

        const retrievability = this.retrievability(elapsedDays, memoryState.stability);
        
        // Índices de parámetros según FSRS
        const w = this.params;
        
        // Nuevos valores de dificultad y estabilidad según el rating
        let newDifficulty = memoryState.difficulty;
        let newStability = memoryState.stability;

        switch (rating) {
            case 1: // Again
                newDifficulty = this.nextDifficulty(memoryState.difficulty, 1);
                newStability = this.nextForgetStability(memoryState.difficulty, memoryState.stability, retrievability);
                break;
            case 2: // Hard
                newDifficulty = this.nextDifficulty(memoryState.difficulty, 2);
                newStability = this.nextRecallStability(memoryState.difficulty, memoryState.stability, retrievability, 2);
                break;
            case 3: // Good
                newDifficulty = this.nextDifficulty(memoryState.difficulty, 3);
                newStability = this.nextRecallStability(memoryState.difficulty, memoryState.stability, retrievability, 3);
                break;
            case 4: // Easy
                newDifficulty = this.nextDifficulty(memoryState.difficulty, 4);
                newStability = this.nextRecallStability(memoryState.difficulty, memoryState.stability, retrievability, 4);
                break;
        }

        const newMemoryState = new FSRSMemoryState(newStability, newDifficulty);
        const interval = this.nextInterval(newStability, desiredRetention);

        return {
            memoryState: newMemoryState,
            interval: interval,
            retrievability: this.retrievability(0, newStability)
        };
    }

    // Calcular la próxima dificultad
    nextDifficulty(difficulty, rating) {
        const w = this.params;
        const deltaD = -w[6] * (rating - 3);
        const meanReversion = w[4] * (this.initDifficulty(4) - difficulty);
        const newD = difficulty + deltaD + meanReversion;
        return Math.max(1, Math.min(10, newD));
    }

    // Dificultad inicial basada en el primer rating
    initDifficulty(rating) {
        const w = this.params;
        return Math.max(1, Math.min(10, w[4] - Math.exp(w[5] * (rating - 1)) + 1));
    }

    // Estabilidad después de olvidar (rating = 1)
    nextForgetStability(difficulty, stability, retrievability) {
        const w = this.params;
        return w[11] * Math.pow(difficulty, -w[12]) * 
               (Math.pow(stability + 1, w[13]) - 1) * 
               Math.exp(w[14] * (1 - retrievability));
    }

    // Estabilidad después de recordar correctamente (rating > 1)
    nextRecallStability(difficulty, stability, retrievability, rating) {
        const w = this.params;
        const hardPenalty = rating === 2 ? w[15] : 1;
        const easyBonus = rating === 4 ? w[16] : 1;
        
        return stability * 
               (Math.exp(w[8]) * 
                (11 - difficulty) * 
                Math.pow(stability, -w[9]) * 
                (Math.exp(w[10] * (1 - retrievability)) - 1) * 
                hardPenalty * easyBonus + 1);
    }

    // Estabilidad inicial para cartas nuevas
    initStability(rating) {
        const w = this.params;
        return Math.max(0.1, w[rating - 1]);
    }

    // Calcular estado de memoria desde datos SM2 (para migración)
    memoryStateFromSM2(easeFactor, interval, historicalRetention = 0.9) {
        const stability = interval;
        const difficulty = 11 - (easeFactor - 1.3) / 0.1;
        return new FSRSMemoryState(
            Math.max(0.1, stability),
            Math.max(1, Math.min(10, difficulty))
        );
    }

    // Procesar historial de revisiones para obtener estado actual
    processReviews(reviews, nextDayAt = Date.now()) {
        if (!reviews || reviews.length === 0) {
            return null;
        }

        let currentState = null;
        let lastReviewTime = 0;

        for (let i = 0; i < reviews.length; i++) {
            const review = reviews[i];
            
            if (i === 0) {
                // Primera revisión - establecer estado inicial
                const difficulty = this.initDifficulty(review.rating);
                const stability = this.initStability(review.rating);
                currentState = new FSRSMemoryState(stability, difficulty);
            } else {
                // Revisiones subsecuentes
                const elapsedDays = review.deltaT;
                const result = this.nextStates(currentState, elapsedDays, review.rating);
                currentState = result.memoryState;
            }
        }

        return currentState;
    }

    // Aplicar fuzz al intervalo para distribución de carga
    withFuzz(interval, factor = 0.25) {
        if (interval <= 1) return interval;
        
        const fuzzRange = Math.max(1, Math.floor(interval * factor));
        const minInterval = Math.max(1, interval - fuzzRange);
        const maxInterval = interval + fuzzRange;
        
        return Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;
    }
}

// Clase principal para manejo de cartas con repetición espaciada
class SpacedRepetitionCard {
    constructor(id, content = {}) {
        this.id = id;
        this.content = content;
        this.memoryState = null;
        this.interval = 0;
        this.due = Date.now();
        this.reps = 0;
        this.lapses = 0;
        this.ctype = 'new'; // 'new', 'learning', 'review'
        this.queue = 'new'; // 'new', 'learning', 'review', 'suspended'
        this.reviews = [];
        this.created = Date.now();
        this.modified = Date.now();

        // Propiedades adicionales para compatibilidad con SM2
        this.easeFactor = 2.5;
        this.quality = 0;
    }

    // Verificar si la carta está vencida
    isDue() {
        return Date.now() >= this.due;
    }

    // Obtener días transcurridos desde la última revisión
    getDaysElapsed() {
        if (this.reviews.length === 0) return 0;
        const lastReview = this.reviews[this.reviews.length - 1];
        const msPerDay = 24 * 60 * 60 * 1000;
        return Math.floor((Date.now() - lastReview.timestamp) / msPerDay);
    }

    // Procesar respuesta del usuario
    processAnswer(rating, fsrs) {
        const now = Date.now();
        const msPerDay = 24 * 60 * 60 * 1000;
        
        // Calcular días transcurridos
        let elapsedDays = 0;
        if (this.reviews.length > 0) {
            const lastReview = this.reviews[this.reviews.length - 1];
            elapsedDays = Math.max(0, Math.floor((now - lastReview.timestamp) / msPerDay));
        }

        // Crear registro de revisión
        const review = {
            rating: rating,
            timestamp: now,
            elapsedDays: elapsedDays,
            interval: this.interval,
            memoryState: this.memoryState ? { ...this.memoryState } : null
        };

        this.reviews.push(review);
        this.reps++;
        this.quality = rating; // Para compatibilidad

        // Procesar según el estado actual de la carta
        if (this.ctype === 'new') {
            this.processNewCard(rating, fsrs);
        } else {
            this.processReviewCard(rating, elapsedDays, fsrs);
        }

        this.modified = now;
        
        return {
            interval: this.interval,
            due: this.due,
            memoryState: this.memoryState
        };
    }

    // Procesar carta nueva
    processNewCard(rating, fsrs) {
        const difficulty = fsrs.initDifficulty(rating);
        const stability = fsrs.initStability(rating);
        
        this.memoryState = new FSRSMemoryState(stability, difficulty);
        this.ctype = 'learning';
        
        if (rating === 1) {
            // Again - mantener en aprendizaje
            this.interval = 0;
            this.queue = 'learning';
            this.due = Date.now() + (10 * 60 * 1000); // 10 minutos
            this.lapses++;
        } else {
            // Graduarse a revisión
            this.interval = fsrs.nextInterval(stability);
            this.interval = fsrs.withFuzz(this.interval);
            this.queue = 'review';
            this.ctype = 'review';
            this.due = Date.now() + (this.interval * 24 * 60 * 60 * 1000);
        }
    }

    // Procesar carta en revisión
    processReviewCard(rating, elapsedDays, fsrs) {
        if (!this.memoryState) {
            // Crear estado desde información SM2 si no existe
            this.memoryState = fsrs.memoryStateFromSM2(this.easeFactor, Math.max(1, this.interval));
        }

        const result = fsrs.nextStates(this.memoryState, elapsedDays, rating);
        this.memoryState = result.memoryState;

        if (rating === 1) {
            // Again - enviar a reaprendizaje
            this.lapses++;
            this.ctype = 'learning';
            this.queue = 'learning';
            this.interval = 0;
            this.due = Date.now() + (10 * 60 * 1000); // 10 minutos
        } else {
            // Mantener en revisión con nuevo intervalo
            this.interval = result.interval;
            this.interval = fsrs.withFuzz(this.interval);
            this.due = Date.now() + (this.interval * 24 * 60 * 60 * 1000);
        }

        // Actualizar easeFactor para compatibilidad (aproximación)
        if (rating >= 3) {
            this.easeFactor = Math.max(1.3, this.easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)));
        }
    }

    // Obtener retrievabilidad actual
    getRetrievability(fsrs) {
        if (!this.memoryState || this.ctype === 'new') return 0;
        
        const elapsedDays = this.getDaysElapsed();
        return fsrs.retrievability(elapsedDays, this.memoryState.stability);
    }

    // Serializar para almacenamiento
    toJSON() {
        return {
            id: this.id,
            content: this.content,
            memoryState: this.memoryState,
            interval: this.interval,
            due: this.due,
            reps: this.reps,
            lapses: this.lapses,
            ctype: this.ctype,
            queue: this.queue,
            reviews: this.reviews,
            created: this.created,
            modified: this.modified,
            easeFactor: this.easeFactor,
            quality: this.quality
        };
    }

    // Crear desde JSON
    static fromJSON(data) {
        const card = new SpacedRepetitionCard(data.id, data.content);
        Object.assign(card, data);
        if (data.memoryState) {
            card.memoryState = new FSRSMemoryState(data.memoryState.stability, data.memoryState.difficulty);
        }
        return card;
    }
}

// Sistema completo de repetición espaciada
class SpacedRepetitionSystem {
    constructor(params = null) {
        this.fsrs = new FSRS(params);
        this.cards = new Map();
        this.desiredRetention = 0.9;
    }

    // Instancia global para compatibilidad con métodos estáticos
    static globalInstance = null;

    // Inicializar instancia global
    static initialize(params = null) {
        if (!SpacedRepetitionSystem.globalInstance) {
            SpacedRepetitionSystem.globalInstance = new SpacedRepetitionSystem(params);
        }
        return SpacedRepetitionSystem.globalInstance;
    }

    // Obtener instancia global
    static getInstance() {
        if (!SpacedRepetitionSystem.globalInstance) {
            SpacedRepetitionSystem.initialize();
        }
        return SpacedRepetitionSystem.globalInstance;
    }

    // MÉTODO FALTANTE: calculateNextReview - necesario para compatibilidad con código existente
    static calculateNextReview(currentCard, quality) {
        const instance = SpacedRepetitionSystem.getInstance();
        return instance.calculateNextReview(currentCard, quality);
    }

    // Implementación del método calculateNextReview
    calculateNextReview(currentCard, quality) {
        // Si no hay carta, crear una nueva estructura
        if (!currentCard) {
            currentCard = {
                interval: 0,
                reps: 0,
                easeFactor: 2.5,
                due: Date.now(),
                lapses: 0,
                memoryState: null
            };
        }

        // Convertir quality (0-5 típico de SM2) a rating FSRS (1-4)
        let rating = 3; // Default: Good
        if (quality <= 1) rating = 1; // Again
        else if (quality === 2) rating = 2; // Hard  
        else if (quality >= 3 && quality <= 4) rating = 3; // Good
        else if (quality >= 5) rating = 4; // Easy

        // Calcular días transcurridos
        const msPerDay = 24 * 60 * 60 * 1000;
        const elapsedDays = currentCard.due ? 
            Math.max(0, Math.floor((Date.now() - currentCard.due) / msPerDay)) : 0;

        // Si es carta nueva o no tiene estado de memoria
        if (!currentCard.memoryState || currentCard.reps === 0) {
            const difficulty = this.fsrs.initDifficulty(rating);
            const stability = this.fsrs.initStability(rating);
            const memoryState = new FSRSMemoryState(stability, difficulty);
            
            let interval = 0;
            let due = Date.now();

            if (rating === 1) {
                // Again - reaprender en 10 minutos
                interval = 0;
                due = Date.now() + (10 * 60 * 1000);
            } else {
                // Graduarse directamente
                interval = this.fsrs.nextInterval(stability);
                interval = this.fsrs.withFuzz(interval);
                due = Date.now() + (interval * msPerDay);
            }

            return {
                interval: interval,
                reps: (currentCard.reps || 0) + 1,
                easeFactor: currentCard.easeFactor || 2.5,
                due: due,
                lapses: rating === 1 ? (currentCard.lapses || 0) + 1 : (currentCard.lapses || 0),
                memoryState: memoryState,
                quality: rating
            };
        }

        // Carta existente con estado de memoria
        const result = this.fsrs.nextStates(currentCard.memoryState, elapsedDays, rating);
        
        let interval = result.interval;
        let due = Date.now();
        let lapses = currentCard.lapses || 0;

        if (rating === 1) {
            // Again - reaprender
            interval = 0;
            due = Date.now() + (10 * 60 * 1000);
            lapses++;
        } else {
            // Intervalo normal con fuzz
            interval = this.fsrs.withFuzz(interval);
            due = Date.now() + (interval * msPerDay);
        }

        // Actualizar easeFactor para compatibilidad (aproximación del algoritmo SM2)
        let newEaseFactor = currentCard.easeFactor || 2.5;
        if (rating >= 3) {
            newEaseFactor = Math.max(1.3, newEaseFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)));
        }

        return {
            interval: interval,
            reps: (currentCard.reps || 0) + 1,
            easeFactor: newEaseFactor,
            due: due,
            lapses: lapses,
            memoryState: result.memoryState,
            quality: rating
        };
    }

    // Métodos estáticos para compatibilidad con código existente
    static getLearningStats() {
        return SpacedRepetitionSystem.getInstance().getLearningStats();
    }

    static addCard(id, content) {
        return SpacedRepetitionSystem.getInstance().addCard(id, content);
    }

    static getCard(id) {
        return SpacedRepetitionSystem.getInstance().getCard(id);
    }

    static getDueCards() {
        return SpacedRepetitionSystem.getInstance().getDueCards();
    }

    static getCardsForReview() {
        return SpacedRepetitionSystem.getInstance().getCardsForReview();
    }

    static getNewCards(limit = 10) {
        return SpacedRepetitionSystem.getInstance().getNewCards(limit);
    }

    static answerCard(cardId, rating) {
        return SpacedRepetitionSystem.getInstance().answerCard(cardId, rating);
    }

    static getStats() {
        return SpacedRepetitionSystem.getInstance().getStats();
    }

    static getUpcomingCards(days = 7) {
        return SpacedRepetitionSystem.getInstance().getUpcomingCards(days);
    }

    static resetCard(cardId) {
        return SpacedRepetitionSystem.getInstance().resetCard(cardId);
    }

    static toggleCardSuspension(cardId) {
        return SpacedRepetitionSystem.getInstance().toggleCardSuspension(cardId);
    }

    static export() {
        return SpacedRepetitionSystem.getInstance().export();
    }

    static import(data) {
        return SpacedRepetitionSystem.getInstance().import(data);
    }

    static cleanupOldCards(daysOld = 365) {
        return SpacedRepetitionSystem.getInstance().cleanupOldCards(daysOld);
    }

    // Métodos adicionales para compatibilidad con SM2
    static updateCardStats(cardId, newStats) {
        const instance = SpacedRepetitionSystem.getInstance();
        return instance.updateCardStats(cardId, newStats);
    }

    static getCardById(cardId) {
        return SpacedRepetitionSystem.getInstance().getCard(cardId);
    }

    static getAllCards() {
        const instance = SpacedRepetitionSystem.getInstance();
        return Array.from(instance.cards.values());
    }

    // Implementar updateCardStats para compatibilidad
    updateCardStats(cardId, newStats) {
        const card = this.cards.get(cardId);
        if (!card) return null;

        // Actualizar estadísticas de la carta
        if (newStats.interval !== undefined) card.interval = newStats.interval;
        if (newStats.reps !== undefined) card.reps = newStats.reps;
        if (newStats.easeFactor !== undefined) card.easeFactor = newStats.easeFactor;
        if (newStats.due !== undefined) card.due = newStats.due;
        if (newStats.lapses !== undefined) card.lapses = newStats.lapses;
        if (newStats.quality !== undefined) card.quality = newStats.quality;
        if (newStats.memoryState !== undefined) {
            card.memoryState = newStats.memoryState;
        }

        // Actualizar tipo y cola basado en estado
        if (card.reps === 0) {
            card.ctype = 'new';
            card.queue = 'new';
        } else if (card.interval === 0 || newStats.quality === 1) {
            card.ctype = 'learning';
            card.queue = 'learning';
        } else {
            card.ctype = 'review';
            card.queue = 'review';
        }

        card.modified = Date.now();
        return card;
    }

    // Agregar carta al sistema
    addCard(id, content) {
        const card = new SpacedRepetitionCard(id, content);
        this.cards.set(id, card);
        return card;
    }

    // Obtener carta por ID
    getCard(id) {
        return this.cards.get(id);
    }

    // Obtener cartas vencidas
    getDueCards() {
        return Array.from(this.cards.values())
            .filter(card => card.queue !== 'suspended' && card.isDue())
            .sort((a, b) => a.due - b.due);
    }

    // Obtener cartas para revisión (alias de getDueCards para compatibilidad)
    getCardsForReview() {
        return this.getDueCards();
    }

    // Obtener cartas nuevas
    getNewCards(limit = 10) {
        return Array.from(this.cards.values())
            .filter(card => card.ctype === 'new')
            .slice(0, limit);
    }

    // Procesar respuesta
    answerCard(cardId, rating) {
        const card = this.cards.get(cardId);
        if (!card) throw new Error('Card not found');
        
        return card.processAnswer(rating, this.fsrs);
    }

    // Obtener estadísticas
    getStats() {
        const cards = Array.from(this.cards.values());
        const now = Date.now();
        
        return {
            total: cards.length,
            new: cards.filter(c => c.ctype === 'new').length,
            learning: cards.filter(c => c.ctype === 'learning').length,
            review: cards.filter(c => c.ctype === 'review').length,
            due: cards.filter(c => c.isDue()).length,
            mature: cards.filter(c => c.ctype === 'review' && c.interval >= 21).length,
            averageRetention: this.calculateAverageRetention()
        };
    }

    // MÉTODO FALTANTE: getLearningStats - necesario para evitar el error
    getLearningStats() {
        const cards = Array.from(this.cards.values());
        const now = Date.now();
        const msPerDay = 24 * 60 * 60 * 1000;
        
        const learningCards = cards.filter(c => c.ctype === 'learning');
        const reviewCards = cards.filter(c => c.ctype === 'review');
        const newCards = cards.filter(c => c.ctype === 'new');
        
        // Calcular cartas por intervalos
        const intervalStats = {
            '1-7': reviewCards.filter(c => c.interval >= 1 && c.interval <= 7).length,
            '8-30': reviewCards.filter(c => c.interval >= 8 && c.interval <= 30).length,
            '31-90': reviewCards.filter(c => c.interval >= 31 && c.interval <= 90).length,
            '90+': reviewCards.filter(c => c.interval > 90).length
        };

        // Calcular tasa de retención por dificultad
        const difficultyStats = {};
        for (let i = 1; i <= 10; i++) {
            const cardsInRange = reviewCards.filter(c => 
                c.memoryState && 
                Math.floor(c.memoryState.difficulty) === i
            );
            difficultyStats[i] = {
                count: cardsInRange.length,
                avgRetention: cardsInRange.length > 0 ? 
                    cardsInRange.reduce((sum, card) => sum + card.getRetrievability(this.fsrs), 0) / cardsInRange.length : 0
            };
        }

        // Cartas próximas a vencer (próximos 7 días)
        const upcoming = reviewCards.filter(c => {
            const daysUntilDue = Math.ceil((c.due - now) / msPerDay);
            return daysUntilDue >= 0 && daysUntilDue <= 7;
        }).length;

        return {
            total: cards.length,
            new: newCards.length,
            learning: learningCards.length,
            review: reviewCards.length,
            due: cards.filter(c => c.isDue()).length,
            mature: reviewCards.filter(c => c.interval >= 21).length,
            young: reviewCards.filter(c => c.interval < 21).length,
            suspended: cards.filter(c => c.queue === 'suspended').length,
            buried: 0, // No implementado aún
            averageRetention: this.calculateAverageRetention(),
            intervalStats,
            difficultyStats,
            upcoming,
            streakDays: this.calculateStreakDays(),
            todayReviews: this.getTodayReviews(),
            successRate: this.calculateSuccessRate()
        };
    }

    // Calcular días de racha de estudio
    calculateStreakDays() {
        const allReviews = [];
        this.cards.forEach(card => {
            allReviews.push(...card.reviews);
        });

        if (allReviews.length === 0) return 0;

        // Ordenar por fecha
        allReviews.sort((a, b) => a.timestamp - b.timestamp);

        const msPerDay = 24 * 60 * 60 * 1000;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let streak = 0;
        let currentDate = new Date(today);

        // Verificar cada día hacia atrás
        while (true) {
            const dayStart = currentDate.getTime();
            const dayEnd = dayStart + msPerDay;
            
            const hasReviewsThisDay = allReviews.some(review => 
                review.timestamp >= dayStart && review.timestamp < dayEnd
            );

            if (hasReviewsThisDay) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    // Obtener revisiones de hoy
    getTodayReviews() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.getTime();
        const todayEnd = todayStart + (24 * 60 * 60 * 1000);

        let todayCount = 0;
        this.cards.forEach(card => {
            todayCount += card.reviews.filter(review =>
                review.timestamp >= todayStart && review.timestamp < todayEnd
            ).length;
        });

        return todayCount;
    }

    // Calcular tasa de éxito
    calculateSuccessRate() {
        let totalReviews = 0;
        let successfulReviews = 0;

        this.cards.forEach(card => {
            card.reviews.forEach(review => {
                totalReviews++;
                if (review.rating >= 2) { // Hard, Good, Easy son exitosas
                    successfulReviews++;
                }
            });
        });

        return totalReviews > 0 ? (successfulReviews / totalReviews) * 100 : 0;
    }

    // Calcular retención promedio
    calculateAverageRetention() {
        const reviewCards = Array.from(this.cards.values())
            .filter(c => c.ctype === 'review' && c.memoryState);
        
        if (reviewCards.length === 0) return 0;
        
        const totalRetention = reviewCards.reduce((sum, card) => {
            return sum + card.getRetrievability(this.fsrs);
        }, 0);
        
        return (totalRetention / reviewCards.length) * 100;
    }

    // Obtener cartas próximas a vencer
    getUpcomingCards(days = 7) {
        const now = Date.now();
        const msPerDay = 24 * 60 * 60 * 1000;
        const limitTime = now + (days * msPerDay);

        return Array.from(this.cards.values())
            .filter(card => card.due > now && card.due <= limitTime)
            .sort((a, b) => a.due - b.due);
    }

    // Resetear carta (útil para desarrollo/testing)
    resetCard(cardId) {
        const card = this.cards.get(cardId);
        if (!card) throw new Error('Card not found');

        card.memoryState = null;
        card.interval = 0;
        card.due = Date.now();
        card.reps = 0;
        card.lapses = 0;
        card.ctype = 'new';
        card.queue = 'new';
        card.reviews = [];
        card.easeFactor = 2.5;
        card.quality = 0;
        card.modified = Date.now();

        return card;
    }

    // Suspender/reactivar carta
    toggleCardSuspension(cardId) {
        const card = this.cards.get(cardId);
        if (!card) throw new Error('Card not found');

        card.queue = card.queue === 'suspended' ? 'review' : 'suspended';
        card.modified = Date.now();

        return card;
    }

    // Exportar datos
    export() {
        return {
            params: this.fsrs.params,
            desiredRetention: this.desiredRetention,
            cards: Array.from(this.cards.values()).map(card => card.toJSON())
        };
    }

    // Importar datos
    import(data) {
        if (data.params) {
            this.fsrs = new FSRS(data.params);
        }
        if (data.desiredRetention) {
            this.desiredRetention = data.desiredRetention;
        }
        if (data.cards) {
            this.cards.clear();
            data.cards.forEach(cardData => {
                const card = SpacedRepetitionCard.fromJSON(cardData);
                this.cards.set(card.id, card);
            });
        }
    }

    // Limpiar cartas antiguas (útil para mantenimiento)
    cleanupOldCards(daysOld = 365) {
        const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
        let removed = 0;

        for (const [id, card] of this.cards.entries()) {
            if (card.modified < cutoffTime && card.ctype === 'new') {
                this.cards.delete(id);
                removed++;
            }
        }

        return removed;
    }
}

// Alias para compatibilidad con código existente
const SpacedRepetition = SpacedRepetitionSystem;

// Funciones adicionales para compatibilidad con SM2 (algoritmo anterior)
SpacedRepetitionSystem.prototype.supermemo2 = function(card, quality) {
    // Implementación básica de SM2 como fallback
    const q = Math.max(0, Math.min(5, quality));
    
    if (q >= 3) {
        if (card.reps === 0) {
            card.interval = 1;
        } else if (card.reps === 1) {
            card.interval = 6;
        } else {
            card.interval = Math.round(card.interval * card.easeFactor);
        }
        card.reps++;
        card.easeFactor = card.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
        if (card.easeFactor < 1.3) card.easeFactor = 1.3;
    } else {
        card.reps = 0;
        card.interval = 1;
        card.lapses++;
    }
    
    card.due = Date.now() + (card.interval * 24 * 60 * 60 * 1000);
    return card;
};

// Métodos estáticos adicionales para máxima compatibilidad
SpacedRepetitionSystem.createCard = function(id, content) {
    return SpacedRepetitionSystem.addCard(id, content);
};

SpacedRepetitionSystem.reviewCard = function(cardId, quality) {
    const instance = SpacedRepetitionSystem.getInstance();
    const card = instance.getCard(cardId);
    if (!card) return null;
    
    // Convertir quality a rating FSRS
    let rating = 3; // Default: Good
    if (quality <= 1) rating = 1; // Again
    else if (quality === 2) rating = 2; // Hard
    else if (quality >= 3 && quality <= 4) rating = 3; // Good
    else if (quality >= 5) rating = 4; // Easy
    
    return card.processAnswer(rating, instance.fsrs);
};

SpacedRepetitionSystem.getCardStats = function(cardId) {
    const card = SpacedRepetitionSystem.getCard(cardId);
    if (!card) return null;
    
    return {
        id: card.id,
        interval: card.interval,
        reps: card.reps,
        easeFactor: card.easeFactor,
        due: card.due,
        lapses: card.lapses,
        quality: card.quality,
        created: card.created,
        modified: card.modified,
        ctype: card.ctype,
        queue: card.queue,
        retrievability: card.memoryState ? card.getRetrievability(SpacedRepetitionSystem.getInstance().fsrs) : 0
    };
};

// Inicializar automáticamente la instancia global
SpacedRepetitionSystem.initialize();

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SpacedRepetition,
        SpacedRepetitionSystem,
        SpacedRepetitionCard,
        FSRS,
        FSRSMemoryState,
        FSRSReview
    };
}

// Exportar como ES modules para uso moderno
export {
    SpacedRepetition,
    SpacedRepetitionSystem,
    SpacedRepetitionCard,
    FSRS,
    FSRSMemoryState,
    FSRSReview
};

// Exportar por defecto el sistema principal con el nombre original
export default SpacedRepetition;