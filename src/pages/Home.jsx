// src/pages/Home.jsx - VERSIÓN CORREGIDA
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SpacedRepetition } from '../services/spacedRepetition';

const Home = ({ 
  cards = [], 
  userProgress = {}, 
  settings = {},
  stats: providedStats = null,
  cardsForReview: providedCardsForReview = null,
  currentDeck = null,
  decks = []
}) => {
  // Calcular estadísticas usando la función correcta (con validación defensiva)
  const stats = useMemo(() => {
    try {
      // Si se proporcionan stats desde props, usarlas
      if (providedStats) {
        return providedStats;
      }
      
      // Asegurarse de que cards es un array
      const safeCards = Array.isArray(cards) ? cards : [];
      const safeProgress = userProgress || {};
      
      // Usar getLearningStats si está disponible
      if (SpacedRepetition?.getLearningStats) {
        return SpacedRepetition.getLearningStats(safeCards, safeProgress);
      }
      
      // Fallback: calcular estadísticas básicas manualmente
      return {
        new: safeCards.filter(card => !safeProgress[card.id]).length,
        learning: 0,
        review: safeCards.filter(card => safeProgress[card.id]?.reviewCount >= 1).length,
        mastered: safeCards.filter(card => safeProgress[card.id]?.reviewCount >= 3).length,
        total: safeCards.length
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        new: 0,
        learning: 0,
        review: 0,
        mastered: 0,
        total: 0
      };
    }
  }, [cards, userProgress, providedStats]);

  // Obtener cartas que necesitan revisión (con validación defensiva)
  const cardsForReview = useMemo(() => {
    try {
      // Si se proporcionan desde props, usarlas
      if (providedCardsForReview) {
        return Array.isArray(providedCardsForReview) ? providedCardsForReview : [];
      }
      
      // Asegurarse de que cards es un array
      const safeCards = Array.isArray(cards) ? cards : [];
      const safeProgress = userProgress || {};
      
      // Usar getCardsForReview si está disponible
      if (SpacedRepetition?.getCardsForReview) {
        const reviewCards = SpacedRepetition.getCardsForReview(safeCards, safeProgress);
        return Array.isArray(reviewCards) ? reviewCards : [];
      }
      
      // Fallback: calcular cartas para revisión manualmente
      return safeCards.filter(card => {
        const cardProgress = safeProgress[card.id];
        if (!cardProgress) return true; // Cartas nuevas necesitan revisión
        
        // Si no hay fecha de última revisión, necesita revisión
        if (!cardProgress.lastReviewed) return true;
        
        // Calcular si necesita revisión basado en intervalo
        const lastReview = new Date(cardProgress.lastReviewed);
        const daysSinceReview = (new Date() - lastReview) / (1000 * 60 * 60 * 24);
        const reviewInterval = Math.min(30, Math.pow(2, cardProgress.reviewCount || 0));
        
        return daysSinceReview >= reviewInterval;
      });
    } catch (error) {
      console.error('Error calculating cards for review:', error);
      return [];
    }
  }, [cards, userProgress, providedCardsForReview]);

  // Calcular racha y progreso diario (con validación defensiva)
  const dailyProgress = useMemo(() => {
    try {
      const today = new Date().toDateString();
      const safeProgress = userProgress || {};
      
      const reviewedToday = Object.values(safeProgress).filter(progress => {
        if (!progress?.lastReviewed) return false;
        try {
          return new Date(progress.lastReviewed).toDateString() === today;
        } catch (error) {
          return false;
        }
      }).length;

      const dailyGoal = settings?.dailyGoal || 20;

      return {
        reviewedToday,
        dailyGoal,
        progressPercentage: Math.min((reviewedToday / dailyGoal) * 100, 100)
      };
    } catch (error) {
      console.error('Error calculating daily progress:', error);
      return {
        reviewedToday: 0,
        dailyGoal: 20,
        progressPercentage: 0
      };
    }
  }, [userProgress, settings.dailyGoal]);

  // Determinar el contexto actual (mazo específico o global)
  const contextInfo = useMemo(() => {
    if (currentDeck) {
      return {
        title: `${currentDeck.icon || '📂'} ${currentDeck.name}`,
        description: currentDeck.description || 'Mazo seleccionado'
      };
    }
    
    return {
      title: '📚 Todas las Tarjetas',
      description: `${Array.isArray(decks) ? decks.length : 0} mazos disponibles`
    };
  }, [currentDeck, decks]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Encabezado de bienvenida */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '20px',
        color: 'white',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>
          {contextInfo.title}
        </h1>
        <p style={{ margin: '0 0 10px 0', opacity: 0.9, fontSize: '14px' }}>
          {contextInfo.description}
        </p>
        <p style={{ margin: 0, opacity: 0.9, fontWeight: 'bold' }}>
          {cardsForReview.length > 0 
            ? `🎯 Tienes ${cardsForReview.length} tarjetas para revisar`
            : '🎉 ¡Excelente! No hay cartas pendientes'
          }
        </p>
      </div>

      {/* Estadísticas diarias */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>
          📊 Progreso de Hoy
        </h3>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '5px',
            fontSize: '14px',
            color: '#666'
          }}>
            <span>Tarjetas revisadas</span>
            <span>{dailyProgress.reviewedToday} / {dailyProgress.dailyGoal}</span>
          </div>
          
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${dailyProgress.progressPercentage}%`,
              height: '100%',
              backgroundColor: dailyProgress.progressPercentage >= 100 ? '#4caf50' : '#2196f3',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {dailyProgress.progressPercentage >= 100 && (
          <div style={{
            backgroundColor: '#e8f5e8',
            color: '#2e7d32',
            padding: '10px',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '14px'
          }}>
            🎯 ¡Felicitaciones! Has cumplido tu meta diaria
          </div>
        )}
      </div>

      {/* Estadísticas de aprendizaje */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>
          📚 Estado de Aprendizaje
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '15px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#ff9800',
              marginBottom: '5px'
            }}>
              {stats.new || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Nuevas</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#2196f3',
              marginBottom: '5px'
            }}>
              {stats.learning || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Aprendiendo</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#9c27b0',
              marginBottom: '5px'
            }}>
              {stats.review || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>En revisión</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#4caf50',
              marginBottom: '5px'
            }}>
              {stats.mastered || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Dominadas</div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: cardsForReview.length > 0 ? '2fr 1fr' : '1fr',
        gap: '15px',
        marginBottom: '20px'
      }}>
        {cardsForReview.length > 0 ? (
          <Link
            to="/practice"
            style={{
              backgroundColor: '#4caf50',
              color: 'white',
              padding: '15px',
              borderRadius: '12px',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
              display: 'block'
            }}
          >
            🚀 Comenzar Estudio ({cardsForReview.length})
          </Link>
        ) : (
          <div style={{
            backgroundColor: '#f5f5f5',
            color: '#666',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center',
            border: '2px dashed #ddd'
          }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
              🎉 ¡Excelente trabajo!
            </p>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>
              No hay tarjetas para revisar ahora. Vuelve más tarde para continuar tu aprendizaje.
            </p>
          </div>
        )}
        
        <Link
          to="/cards"
          style={{
            backgroundColor: '#2196f3',
            color: 'white',
            padding: '15px',
            borderRadius: '12px',
            textDecoration: 'none',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          📝 Mis Tarjetas
        </Link>
      </div>

      {/* Información adicional */}
      {stats.total > 0 && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
            Total de tarjetas: <strong>{stats.total}</strong>
            {currentDeck && (
              <span style={{ marginLeft: '10px', color: currentDeck.color || '#007bff' }}>
                en {currentDeck.name}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Resumen de mazos (solo si no hay mazo seleccionado) */}
      {!currentDeck && Array.isArray(decks) && decks.length > 1 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '80px', // Espacio para la navegación inferior
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>
            📂 Tus Mazos
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {decks.map(deck => {
              const deckCards = Array.isArray(cards) ? cards.filter(card => card.deckId === deck.id) : [];
              const deckReviewCards = Array.isArray(cardsForReview) ? cardsForReview.filter(card => card.deckId === deck.id) : [];
              
              return (
                <div
                  key={deck.id}
                  style={{
                    backgroundColor: '#f8f9fa',
                    border: `2px solid ${deck.color || '#007bff'}`,
                    borderRadius: '8px',
                    padding: '12px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    fontSize: '24px',
                    marginBottom: '8px'
                  }}>
                    {deck.icon || '📚'}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: '4px'
                  }}>
                    {deck.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '8px'
                  }}>
                    {deckCards.length} tarjetas
                  </div>
                  {deckReviewCards.length > 0 && (
                    <div style={{
                      fontSize: '12px',
                      color: '#ff5722',
                      fontWeight: 'bold'
                    }}>
                      🎯 {deckReviewCards.length} pendientes
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Espacio adicional si hay mazo seleccionado */}
      {currentDeck && (
        <div style={{ marginBottom: '80px' }}></div>
      )}
    </div>
  );
};

export default Home;