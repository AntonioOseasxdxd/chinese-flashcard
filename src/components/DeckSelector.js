// src/components/DeckSelector.js
import React, { useState } from 'react';

const DeckSelector = ({ 
  decks, 
  currentDeck, 
  onDeckChange, 
  onCreateDeck, 
  compact = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDeckForm, setNewDeckForm] = useState({
    name: '',
    description: '',
    color: '#007bff',
    icon: '📚'
  });

  const handleCreateDeck = async (e) => {
    e.preventDefault();
    if (!newDeckForm.name.trim()) return;

    try {
      const createdDeck = await onCreateDeck(newDeckForm);
      setNewDeckForm({
        name: '',
        description: '',
        color: '#007bff',
        icon: '📚'
      });
      setShowCreateForm(false);
      onDeckChange(createdDeck);
    } catch (error) {
      console.error('Error creating deck:', error);
      alert('Error al crear el mazo');
    }
  };

  const availableIcons = ['📚', '🎯', '🧠', '💡', '🚀', '⭐', '🔥', '💪', '🎨', '🔬'];
  const availableColors = [
    '#007bff', '#28a745', '#dc3545', '#ffc107', 
    '#6f42c1', '#fd7e14', '#20c997', '#e83e8c'
  ];

  if (compact) {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            backgroundColor: currentDeck?.color || '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {currentDeck?.icon} {currentDeck?.name}
          <span style={{ fontSize: '10px' }}>▼</span>
        </button>

        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 1000,
            minWidth: '200px'
          }}>
            {decks.map(deck => (
              <button
                key={deck.id}
                onClick={() => {
                  onDeckChange(deck);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: deck.id === currentDeck?.id ? '#f8f9fa' : 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 
                  deck.id === currentDeck?.id ? '#f8f9fa' : 'white'
                }
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: deck.color,
                    borderRadius: '2px'
                  }}
                />
                {deck.icon} {deck.name}
                <small style={{ color: '#6c757d', marginLeft: 'auto' }}>
                  {deck.cardCount || 0}
                </small>
              </button>
            ))}
            
            <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #eee' }} />
            
            <button
              onClick={() => {
                setShowCreateForm(true);
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                backgroundColor: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#007bff'
              }}
            >
              + Crear nuevo mazo
            </button>
          </div>
        )}

        {/* Modal para crear mazo */}
        {showCreateForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
            <form
              onSubmit={handleCreateDeck}
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '400px'
              }}
            >
              <h3 style={{ margin: '0 0 16px 0' }}>Crear Nuevo Mazo</h3>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                  Nombre del mazo:
                </label>
                <input
                  type="text"
                  value={newDeckForm.name}
                  onChange={(e) => setNewDeckForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Vocabulario HSK 1"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                  Descripción (opcional):
                </label>
                <input
                  type="text"
                  value={newDeckForm.description}
                  onChange={(e) => setNewDeckForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del mazo"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                    Icono:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {availableIcons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewDeckForm(prev => ({ ...prev, icon }))}
                        style={{
                          padding: '4px',
                          border: newDeckForm.icon === icon ? '2px solid #007bff' : '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                    Color:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {availableColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewDeckForm(prev => ({ ...prev, color }))}
                        style={{
                          width: '24px',
                          height: '24px',
                          backgroundColor: color,
                          border: newDeckForm.color === color ? '2px solid #333' : '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Crear Mazo
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Versión completa (no compact)
  return (
    <div style={{
      padding: '16px',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #ddd',
      marginBottom: '16px'
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Mazos disponibles:</h3>
      
      <div style={{ display: 'grid', gap: '8px' }}>
        {decks.map(deck => (
          <button
            key={deck.id}
            onClick={() => onDeckChange(deck)}
            style={{
              padding: '12px',
              border: deck.id === currentDeck?.id ? `2px solid ${deck.color}` : '1px solid #ddd',
              borderRadius: '6px',
              backgroundColor: deck.id === currentDeck?.id ? `${deck.color}10` : 'white',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: deck.color,
                borderRadius: '4px'
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                {deck.icon} {deck.name}
              </div>
              {deck.description && (
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  {deck.description}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', fontSize: '12px', color: '#6c757d' }}>
              {deck.cardCount || 0} cartas
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowCreateForm(true)}
        style={{
          width: '100%',
          padding: '12px',
          marginTop: '12px',
          border: '2px dashed #007bff',
          borderRadius: '6px',
          backgroundColor: 'white',
          color: '#007bff',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        + Crear nuevo mazo
      </button>

      {/* Modal para crear mazo - igual que en versión compact */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <form
            onSubmit={handleCreateDeck}
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '400px'
            }}
          >
            <h3 style={{ margin: '0 0 16px 0' }}>Crear Nuevo Mazo</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Nombre del mazo:
              </label>
              <input
                type="text"
                value={newDeckForm.name}
                onChange={(e) => setNewDeckForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Vocabulario HSK 1"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Descripción (opcional):
              </label>
              <input
                type="text"
                value={newDeckForm.description}
                onChange={(e) => setNewDeckForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del mazo"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                  Icono:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {availableIcons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewDeckForm(prev => ({ ...prev, icon }))}
                      style={{
                        padding: '4px',
                        border: newDeckForm.icon === icon ? '2px solid #007bff' : '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                  Color:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {availableColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewDeckForm(prev => ({ ...prev, color }))}
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: color,
                        border: newDeckForm.color === color ? '2px solid #333' : '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Crear Mazo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DeckSelector;