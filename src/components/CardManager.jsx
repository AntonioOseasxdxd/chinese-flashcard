// src/components/CardManager.jsx
import { useState } from 'react';

const CardManager = ({ cards, onAddCard, onDeleteCard }) => {
  const [showForm, setShowForm] = useState(false);
  const [newCard, setNewCard] = useState({
    chinese: '',
    pinyin: '',
    english: '',
    difficulty: 'easy',
    category: 'custom',
    cardType: 'basic',
    imageUrl: '',
    audioUrl: '',
    // Para tarjetas de opción múltiple
    correctOption: '',
    wrongOption1: '',
    wrongOption2: ''
  });

  // Tipos de tarjetas disponibles
  const cardTypes = [
    { 
      value: 'basic', 
      label: '📚 Básica (y tarjeta invertida)',
      description: 'Anverso: Chino → Inglés | Reverso: Inglés → Chino'
    },
    { 
      value: 'basic-typing', 
      label: '⌨️ Básica (teclear la respuesta)',
      description: 'Anverso: Inglés | Reverso: Teclear Chino'
    },
    { 
      value: 'image-recognition', 
      label: '🖼️ Imagen (reconocimiento)',
      description: 'Anverso: Imagen | Reverso: Opciones múltiples'
    },
    { 
      value: 'image-typing', 
      label: '🖼️ Imagen (teclear pinyin)',
      description: 'Anverso: Imagen | Reverso: Teclear Pinyin'
    },
    { 
      value: 'audio-typing', 
      label: '🔊 Audio (teclear lo que escuchas)',
      description: 'Anverso: Audio | Reverso: Teclear Pinyin'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones específicas por tipo de tarjeta
    switch (newCard.cardType) {
      case 'basic':
        if (!newCard.chinese || !newCard.english) {
          alert('Por favor completa Chino e Inglés');
          return;
        }
        break;
        
      case 'basic-typing':
        if (!newCard.chinese || !newCard.english) {
          alert('Por favor completa Chino e Inglés');
          return;
        }
        break;
        
      case 'image-recognition':
        if (!newCard.imageUrl || !newCard.correctOption || !newCard.wrongOption1 || !newCard.wrongOption2) {
          alert('Por favor completa la imagen y todas las opciones');
          return;
        }
        break;
        
      case 'image-typing':
        if (!newCard.imageUrl || !newCard.pinyin) {
          alert('Por favor completa la imagen y el pinyin');
          return;
        }
        break;
        
      case 'audio-typing':
        if (!newCard.audioUrl || !newCard.pinyin) {
          alert('Por favor completa el audio y el pinyin');
          return;
        }
        break;
    }

    const card = {
      id: Date.now(),
      ...newCard,
      createdAt: new Date(),
      lastReviewed: null,
      nextReview: new Date(),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      isNew: true
    };

    onAddCard(card);
    
    // Limpiar formulario
    setNewCard({
      chinese: '',
      pinyin: '',
      english: '',
      difficulty: 'easy',
      category: 'custom',
      cardType: 'basic',
      imageUrl: '',
      audioUrl: '',
      correctOption: '',
      wrongOption1: '',
      wrongOption2: ''
    });
    
    setShowForm(false);
    alert('¡Tarjeta agregada exitosamente!');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCard(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDelete = (cardId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarjeta?')) {
      onDeleteCard(cardId);
    }
  };

  const getCardTypeIcon = (cardType) => {
    const icons = {
      'basic': '📚',
      'basic-typing': '⌨️',
      'image-recognition': '🖼️',
      'image-typing': '🖼️⌨️',
      'audio-typing': '🔊⌨️'
    };
    return icons[cardType] || '📚';
  };

  const selectedCardType = cardTypes.find(type => type.value === newCard.cardType);

  // Función para determinar qué campos mostrar según el tipo de tarjeta
  const renderFieldsForCardType = () => {
    switch (newCard.cardType) {
      case 'basic':
        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Chino (汉字) *
                </label>
                <input
                  type="text"
                  name="chinese"
                  value={newCard.chinese}
                  onChange={handleChange}
                  placeholder="你好"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Inglés *
                </label>
                <input
                  type="text"
                  name="english"
                  value={newCard.english}
                  onChange={handleChange}
                  placeholder="hello"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
            </div>
          </>
        );

      case 'basic-typing':
        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Inglés (Anverso) *
                </label>
                <input
                  type="text"
                  name="english"
                  value={newCard.english}
                  onChange={handleChange}
                  placeholder="hello"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Chino (Reverso) *
                </label>
                <input
                  type="text"
                  name="chinese"
                  value={newCard.chinese}
                  onChange={handleChange}
                  placeholder="你好"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
            </div>
          </>
        );

      case 'image-recognition':
        return (
          <>
            {/* URL de imagen */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                URL de Imagen (Anverso) * 🖼️
              </label>
              <input
                type="url"
                name="imageUrl"
                value={newCard.imageUrl}
                onChange={handleChange}
                placeholder="https://ejemplo.com/imagen.jpg"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
                required
              />
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                💡 Puedes usar URLs de imágenes de Google Images, Wikimedia, o subir a un servicio como Imgur
              </div>
            </div>

            {/* Opciones múltiples */}
            <div style={{ 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              borderRadius: '8px', 
              padding: '15px', 
              marginBottom: '15px' 
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>
                🎯 Opciones de Respuesta Múltiple (Reverso)
              </h4>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#28a745' }}>
                  ✅ Opción Correcta *
                </label>
                <input
                  type="text"
                  name="correctOption"
                  value={newCard.correctOption}
                  onChange={handleChange}
                  placeholder="hello"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #28a745',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#dc3545' }}>
                    ❌ Opción Incorrecta 1 *
                  </label>
                  <input
                    type="text"
                    name="wrongOption1"
                    value={newCard.wrongOption1}
                    onChange={handleChange}
                    placeholder="goodbye"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #dc3545',
                      borderRadius: '6px',
                      fontSize: '16px'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#dc3545' }}>
                    ❌ Opción Incorrecta 2 *
                  </label>
                  <input
                    type="text"
                    name="wrongOption2"
                    value={newCard.wrongOption2}
                    onChange={handleChange}
                    placeholder="thank you"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #dc3545',
                      borderRadius: '6px',
                      fontSize: '16px'
                    }}
                    required
                  />
                </div>
              </div>
            </div>
          </>
        );

      case 'image-typing':
        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  URL de Imagen (Anverso) * 🖼️
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={newCard.imageUrl}
                  onChange={handleChange}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                  required
                />
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                  💡 El usuario verá la imagen
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Pinyin (Reverso) *
                </label>
                <input
                  type="text"
                  name="pinyin"
                  value={newCard.pinyin}
                  onChange={handleChange}
                  placeholder="nǐ hǎo"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                  required
                />
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                  💡 El usuario escribirá esto
                </div>
              </div>
            </div>
          </>
        );

      case 'audio-typing':
        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  URL de Audio (Anverso) * 🔊
                </label>
                <input
                  type="url"
                  name="audioUrl"
                  value={newCard.audioUrl}
                  onChange={handleChange}
                  placeholder="https://ejemplo.com/audio.mp3"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                  required
                />
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                  💡 El usuario escuchará esto
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Pinyin (Reverso) *
                </label>
                <input
                  type="text"
                  name="pinyin"
                  value={newCard.pinyin}
                  onChange={handleChange}
                  placeholder="nǐ hǎo"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                  required
                />
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                  💡 El usuario escribirá esto
                </div>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="card-manager" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '10px'
      }}>
        <h2 style={{ margin: 0, color: '#333' }}>
          Mis Tarjetas ({cards.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            backgroundColor: showForm ? '#dc3545' : '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
        >
          {showForm ? '❌ Cancelar' : '➕ Agregar Tarjeta'}
        </button>
      </div>

      {showForm && (
        <form 
          onSubmit={handleSubmit} 
          style={{
            backgroundColor: '#f8f9fa',
            padding: '25px',
            borderRadius: '12px',
            marginBottom: '25px',
            border: '1px solid #dee2e6',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}
        >
          <h3 style={{ marginTop: 0, color: '#495057', marginBottom: '20px' }}>
            Nueva Tarjeta
          </h3>

          {/* Selector de tipo de tarjeta */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
              Tipo de Tarjeta
            </label>
            <select
              name="cardType"
              value={newCard.cardType}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ced4da',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white'
              }}
            >
              {cardTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {selectedCardType && (
              <div style={{
                marginTop: '8px',
                padding: '10px',
                backgroundColor: '#e3f2fd',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#1976d2'
              }}>
                💡 {selectedCardType.description}
              </div>
            )}
          </div>
          
          {/* Campos dinámicos según el tipo de tarjeta */}
          {renderFieldsForCardType()}

          {/* Campos comunes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Dificultad
              </label>
              <select
                name="difficulty"
                value={newCard.difficulty}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                <option value="easy">🟢 Fácil</option>
                <option value="medium">🟡 Medio</option>
                <option value="hard">🔴 Difícil</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Categoría
              </label>
              <input
                type="text"
                name="category"
                value={newCard.category}
                onChange={handleChange}
                placeholder="personalizado"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '15px 40px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            💾 Guardar Tarjeta
          </button>
        </form>
      )}

      <div style={{ marginTop: '25px' }}>
        <h3 style={{ color: '#495057', marginBottom: '15px' }}>Lista de Tarjetas</h3>
        {cards.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#6c757d', 
            padding: '40px',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '2px dashed #dee2e6'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📚</div>
            <p style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>
              No hay tarjetas aún
            </p>
            <p style={{ margin: 0, fontSize: '14px' }}>
              ¡Agrega tu primera tarjeta para comenzar a aprender!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {cards.map((card) => (
              <div
                key={card.id}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px' }}>
                      {getCardTypeIcon(card.cardType)}
                    </span>
                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
                      {card.chinese || 'Imagen/Audio'}
                    </span>
                    {card.pinyin && (
                      <span style={{ color: '#007bff', fontSize: '16px', fontWeight: '500' }}>
                        {card.pinyin}
                      </span>
                    )}
                    {card.english && (
                      <span style={{ color: '#6c757d', fontSize: '16px' }}>
                        → {card.english}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#6c757d' }}>
                    <span>Tipo: {cardTypes.find(t => t.value === card.cardType)?.label || 'Básica'}</span>
                    <span>Dificultad: {card.difficulty}</span>
                    <span>Categoría: {card.category}</span>
                    {card.repetitions > 0 && <span>Repeticiones: {card.repetitions}</span>}
                  </div>

                  {/* Mostrar información adicional según el tipo */}
                  {card.imageUrl && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#28a745' }}>
                      🖼️ Imagen incluida
                    </div>
                  )}
                  {card.audioUrl && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#17a2b8' }}>
                      🔊 Audio incluido
                    </div>
                  )}
                  {card.cardType === 'image-recognition' && card.correctOption && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6f42c1' }}>
                      🎯 Opciones múltiples configuradas
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleDelete(card.id)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '10px 15px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease'
                  }}
                  title="Eliminar tarjeta"
                >
                  🗑️ Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estadísticas por tipo de tarjeta */}
      {cards.length > 0 && (
        <div style={{
          marginTop: '25px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>📊 Estadísticas por Tipo</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {cardTypes.map(type => {
              const count = cards.filter(card => card.cardType === type.value).length;
              if (count === 0) return null;
              
              return (
                <div key={type.value} style={{
                  padding: '10px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #dee2e6'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                    {type.label}
                  </div>
                  <div style={{ fontSize: '20px', color: '#007bff', fontWeight: 'bold' }}>
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CardManager;