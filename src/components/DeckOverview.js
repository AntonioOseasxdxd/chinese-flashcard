// src/components/DeckOverview.js
import React from 'react';
import { Link } from 'react-router-dom';

const DeckOverview = ({ 
  currentDeck, 
  stats, 
  totalStats, 
  onSwitchDeck,
  decks = [],
  getDecksWithStats 
}) => {
  const decksWithStats = getDecksWithStats ? getDecksWithStats() : [];

  // Obtener mazos con más actividad reciente
  const getTopDecks = () => {
    return decksWithStats
      .filter(deck => deck.cardCount > 0)
      .sort((a, b) => b.cardsForReview - a.cardsForReview)
      .slice(0, 3);
  };

  const topDecks = getTopDecks();

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      border: '1px solid #e9ecef',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '18px', 
          color: '#495057',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🗂️ Mazos de Estudio
        </h3>
        <Link
          to="/decks"
          style={{
            padding: '6px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          Ver todos
        </Link>
      </div>

      {/* Mazo actual destacado */}
      {currentDeck && (
        <div style={{
          padding: '16px',
          backgroundColor: `${currentDeck.color}15`,
          border: `2px solid ${currentDeck.color}`,
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: currentDeck.color,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}
            >
              {currentDeck.icon}
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '16px', color: '#495057' }}>
                {currentDeck.name}
              </h4>
              <span style={{
                backgroundColor: currentDeck.color,
                color: 'white',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: '500'
              }}>
                MAZO ACTUAL
              </span>
            </div>
          </div>

          {currentDeck.description && (
            <p style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              color: '#6c757d' 
            }}>
              {currentDeck.description}
            </p>
          )}

          {/* Estadísticas del mazo actual */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: '12px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: currentDeck.color 
              }}>
                {stats.totalCards}
              </div>
              <div style={{ fontSize: '11px', color: '#6c757d' }}>Cartas</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: '#28a745' 
              }}>
                {stats.reviewedCards}
              </div>
              <div style={{ fontSize: '11px', color: '#6c757d' }}>Revisadas</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: '#ffc107' 
              }}>
                {stats.cardsForReview}
              </div>
              <div style={{ fontSize: '11px', color: '#6c757d' }}>Pendientes</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: '#17a2b8' 
              }}>
                {stats.accuracy}%
              </div>
              <div style={{ fontSize: '11px', color: '#6c757d' }}>Precisión</div>
            </div>
          </div>
        </div>
      )}

      {/* Resumen global */}
      {totalStats && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#6c757d',
            marginBottom: '6px',
            fontWeight: '500'
          }}>
            📊 RESUMEN GLOBAL
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
            gap: '8px',
            fontSize: '11px',
            textAlign: 'center'
          }}>
            <div>
              <strong style={{ color: '#495057' }}>{totalStats.totalDecks}</strong>
              <br />
              <span style={{ color: '#6c757d' }}>Mazos</span>
            </div>
            <div>
              <strong style={{ color: '#495057' }}>{totalStats.totalCards}</strong>
              <br />
              <span style={{ color: '#6c757d' }}>Cartas</span>
            </div>
            <div>
              <strong style={{ color: '#28a745' }}>{totalStats.reviewedCards}</strong>
              <br />
              <span style={{ color: '#6c757d' }}>Revisadas</span>
            </div>
            <div>
              <strong style={{ color: '#17a2b8' }}>{totalStats.accuracy}%</strong>
              <br />
              <span style={{ color: '#6c757d' }}>Precisión</span>
            </div>
          </div>
        </div>
      )}

      {/* Mazos con más actividad */}
      {topDecks.length > 0 && (
        <div>
          <h4 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '14px', 
            color: '#6c757d',
            fontWeight: '500'
          }}>
            🔥 MAZOS CON MÁS ACTIVIDAD
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topDecks.map((deck, index) => (
              <div
                key={deck.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: deck.id === currentDeck?.id ? `${deck.color}10` : '#f8f9fa',
                  border: deck.id === currentDeck?.id ? `1px solid ${deck.color}` : '1px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: deck.id !== currentDeck?.id ? 'pointer' : 'default'
                }}
                onClick={() => {
                  if (deck.id !== currentDeck?.id && onSwitchDeck) {
                    onSwitchDeck(deck);
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px' }}>{index + 1}.</span>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: deck.color,
                      borderRadius: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px'
                    }}
                  >
                    {deck.icon}
                  </div>
                  <span style={{ fontWeight: '500' }}>{deck.name}</span>
                  {deck.id === currentDeck?.id && (
                    <span style={{
                      backgroundColor: deck.color,
                      color: 'white',
                      padding: '1px 4px',
                      borderRadius: '8px',
                      fontSize: '9px'
                    }}>
                      ACTUAL
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                  {deck.cardsForReview > 0 && (
                    <span style={{
                      color: '#dc3545',
                      fontWeight: '500'
                    }}>
                      {deck.cardsForReview} pendientes
                    </span>
                  )}
                  <span style={{ color: '#6c757d' }}>
                    {deck.cardCount} cartas
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado sin mazos */}
      {decksWithStats.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#6c757d'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
          <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>
            No hay mazos creados
          </h4>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
            Crea tu primer mazo para organizar tus flashcards
          </p>
          <Link
            to="/decks"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            Crear primer mazo
          </Link>
        </div>
      )}

      {/* Acciones rápidas */}
      {currentDeck && stats.cardsForReview > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '6px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '12px', color: '#856404' }}>
                ⏰ Tienes {stats.cardsForReview} cartas para revisar
              </span>
            </div>
            <Link
              to="/practice"
              style={{
                padding: '6px 12px',
                backgroundColor: '#ffc107',
                color: '#212529',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              Practicar ahora
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckOverview;