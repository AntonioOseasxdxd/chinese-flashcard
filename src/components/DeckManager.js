// src/components/DeckManager.js
import React, { useState } from 'react';

const DeckManager = ({ 
  decks, 
  currentDeck,
  cards,
  progress,
  onAddDeck, 
  onUpdateDeck, 
  onDeleteDeck, 
  onSwitchDeck,
  getDecksWithStats,
  loading = false
}) => {
  const [editingDeck, setEditingDeck] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [newDeck, setNewDeck] = useState({ 
    name: '', 
    description: '', 
    color: '#007bff', 
    icon: '📚' 
  });

  const availableIcons = ['📚', '🎯', '🧠', '💡', '🚀', '⭐', '🔥', '💪'];
  const availableColors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1', '#fd7e14'];

  const decksWithStats = getDecksWithStats ? getDecksWithStats(cards, progress) : decks.map(deck => ({
    ...deck,
    cardCount: cards.filter(card => card.deckId === deck.id).length,
    reviewedCards: cards.filter(card => card.deckId === deck.id && progress[card.id]).length
  }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newDeck.name.trim()) return alert('Ingresa un nombre para el mazo');
    
    try {
      await onAddDeck(newDeck);
      setNewDeck({ name: '', description: '', color: '#007bff', icon: '📚' });
      setShowCreateForm(false);
      alert(`¡Mazo "${newDeck.name}" creado!`);
    } catch (error) {
      alert('Error al crear el mazo');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingDeck.name.trim()) return alert('Ingresa un nombre válido');
    
    try {
      await onUpdateDeck(editingDeck.id, editingDeck);
      setEditingDeck(null);
      alert(`¡Mazo actualizado!`);
    } catch (error) {
      alert('Error al actualizar el mazo');
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    
    try {
      await onDeleteDeck(showDeleteConfirm.id);
      setShowDeleteConfirm(null);
      alert('¡Mazo eliminado!');
    } catch (error) {
      alert('Error al eliminar el mazo');
    }
  };

  const handleSwitchDeck = async (deck) => {
    try {
      await onSwitchDeck(deck);
      alert(`Cambiado al mazo "${deck.name}"`);
    } catch (error) {
      alert('Error al cambiar de mazo');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>⏳</div>
        <p>Cargando mazos...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>🗂️ Administrar Mazos ({decksWithStats.length})</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: '12px 20px', backgroundColor: '#007bff', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          ➕ Crear Mazo
        </button>
      </div>

      {/* Lista de mazos */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {decksWithStats.map(deck => (
          <div
            key={deck.id}
            style={{
              backgroundColor: 'white',
              border: deck.id === currentDeck?.id ? `3px solid ${deck.color}` : '1px solid #dee2e6',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: deck.id === currentDeck?.id ? `0 4px 15px ${deck.color}30` : '0 2px 10px rgba(0,0,0,0.1)',
              position: 'relative'
            }}
          >
            {/* Badge de mazo activo */}
            {deck.id === currentDeck?.id && (
              <div style={{
                position: 'absolute', top: '-8px', right: '20px',
                padding: '4px 12px', backgroundColor: deck.color, color: 'white',
                borderRadius: '12px', fontSize: '12px', fontWeight: 'bold'
              }}>
                ✨ ACTIVO
              </div>
            )}

            {/* Header del mazo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                <div style={{
                  width: '48px', height: '48px', backgroundColor: deck.color,
                  borderRadius: '12px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '24px'
                }}>
                  {deck.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '20px', color: '#333', marginBottom: '4px' }}>
                    {deck.name}
                  </h3>
                  {deck.description && (
                    <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
                      {deck.description}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setEditingDeck(deck)}
                  style={{
                    padding: '8px 12px', backgroundColor: '#ffc107', color: '#000',
                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
                  }}
                >
                  ✏️ Editar
                </button>
                
                {deck.id !== 'default' && decks.length > 1 && (
                  <button
                    onClick={() => setShowDeleteConfirm({id: deck.id, name: deck.name, cardCount: deck.cardCount})}
                    style={{
                      padding: '8px 12px', backgroundColor: '#dc3545', color: 'white',
                      border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                )}
              </div>
            </div>

            {/* Estadísticas */}
            <div style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '15px', marginBottom: '15px', padding: '15px',
              backgroundColor: '#f8f9fa', borderRadius: '8px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: deck.color }}>
                  {deck.cardCount || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>Total Cartas</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                  {deck.reviewedCards || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>Revisadas</div>
              </div>
            </div>

            {/* Botón cambiar mazo */}
            {deck.id !== currentDeck?.id && (
              <button
                onClick={() => handleSwitchDeck(deck)}
                style={{
                  width: '100%', padding: '12px', backgroundColor: deck.color,
                  color: 'white', border: 'none', borderRadius: '8px',
                  cursor: 'pointer', fontWeight: 'bold'
                }}
              >
                🔄 Cambiar a este mazo
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Modal crear mazo */}
      {showCreateForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <form onSubmit={handleCreate} style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '12px',
            width: '400px', maxWidth: '90vw'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>🏗️ Crear Nuevo Mazo</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                Nombre del mazo *
              </label>
              <input
                type="text"
                value={newDeck.name}
                onChange={(e) => setNewDeck(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%', padding: '12px', border: '2px solid #dee2e6',
                  borderRadius: '6px', boxSizing: 'border-box'
                }}
                required
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Icono:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {availableIcons.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewDeck(prev => ({ ...prev, icon }))}
                    style={{
                      padding: '8px',
                      border: newDeck.icon === icon ? '3px solid #007bff' : '2px solid #dee2e6',
                      borderRadius: '8px',
                      backgroundColor: newDeck.icon === icon ? '#e3f2fd' : 'white',
                      cursor: 'pointer',
                      fontSize: '18px'
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Color:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {availableColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewDeck(prev => ({ ...prev, color }))}
                    style={{
                      width: '40px', height: '40px', backgroundColor: color,
                      border: newDeck.color === color ? '4px solid #333' : '2px solid #dee2e6',
                      borderRadius: '8px', cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '12px 20px', border: '2px solid #6c757d',
                  backgroundColor: 'white', color: '#6c757d',
                  borderRadius: '6px', cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '12px 20px', backgroundColor: '#007bff',
                  color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
                }}
              >
                Crear Mazo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal editar mazo */}
      {editingDeck && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <form onSubmit={handleUpdate} style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '12px',
            width: '400px', maxWidth: '90vw'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>✏️ Editar Mazo</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                Nombre del mazo *
              </label>
              <input
                type="text"
                value={editingDeck.name}
                onChange={(e) => setEditingDeck(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%', padding: '12px', border: '2px solid #dee2e6',
                  borderRadius: '6px', boxSizing: 'border-box'
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setEditingDeck(null)}
                style={{
                  padding: '12px 20px', border: '2px solid #6c757d',
                  backgroundColor: 'white', color: '#6c757d',
                  borderRadius: '6px', cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '12px 20px', backgroundColor: '#ffc107',
                  color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer'
                }}
              >
                Actualizar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal eliminar */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '12px',
            width: '400px', maxWidth: '90vw', textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 15px 0', color: '#dc3545' }}>¡Confirmar Eliminación!</h3>
            
            <p style={{ margin: '0 0 20px 0' }}>
              Vas a eliminar el mazo "<strong>{showDeleteConfirm.name}</strong>" con{' '}
              <strong>{showDeleteConfirm.cardCount} tarjetas</strong>.
            </p>
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                style={{
                  padding: '12px 24px', border: '2px solid #6c757d',
                  backgroundColor: 'white', color: '#6c757d',
                  borderRadius: '6px', cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '12px 24px', backgroundColor: '#dc3545',
                  color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
                }}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckManager;