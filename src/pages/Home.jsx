// src/pages/Home.jsx
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SpacedRepetition } from '../services/spacedRepetition';

const Home = ({ cards = [], userProgress = {}, settings = {} }) => {
  // Calcular estadísticas usando la función correcta
  const stats = useMemo(() => {
    // Usar getLearningStats en lugar de getStudyStats
    return SpacedRepetition.getLearningStats(cards, userProgress);
  }, [cards, userProgress]);

  // Obtener cartas que necesitan revisión
  const cardsForReview = useMemo(() => {
    return SpacedRepetition.getCardsForReview(cards, userProgress);
  }, [cards, userProgress]);

  // Calcular racha y progreso diario
  const dailyProgress = useMemo(() => {
    const today = new Date().toDateString();
    const reviewedToday = Object.values(userProgress).filter(progress => {
      if (!progress.lastReviewed) return false;
      return new Date(progress.lastReviewed).toDateString() === today;
    }).length;

    return {
      reviewedToday,
      dailyGoal: settings.dailyGoal || 20,
      progressPercentage: Math.min((reviewedToday / (settings.dailyGoal || 20)) * 100, 100)
    };
  }, [userProgress, settings.dailyGoal]);

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
        <h1 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
          ¡Bien hecho! 🎉
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          {cardsForReview.length > 0 
            ? `Tienes ${cardsForReview.length} tarjetas para revisar`
            : 'No hay cartas para revisar en este momento'
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
              {stats.new}
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
              {stats.learning}
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
              {stats.review}
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
              {stats.mastered}
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
        marginBottom: '80px' // Espacio para la navegación inferior
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
              boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
            }}
          >
            🚀 Comenzar Estudio
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;