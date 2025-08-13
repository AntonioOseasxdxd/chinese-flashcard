// src/components/CardManager.jsx - ACTUALIZADO CON EDITAR Y ELIMINAR MAZOS
import { useState, useEffect } from 'react';

const CardManager = ({ 
  cards, 
  onAddCard, 
  onDeleteCard, 
  onEditCard,
  decks,
  currentDeck,
  onAddDeck,
  onSwitchDeck,
  onEditDeck,
  onDeleteDeck,
  loading,
  
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [showCreateDeckForm, setShowCreateDeckForm] = useState(false);
  const [showEditDeckForm, setShowEditDeckForm] = useState(false);  // NUEVO ESTADO
  const [showDeckManager, setShowDeckManager] = useState(false);    // NUEVO ESTADO
  const [editingDeck, setEditingDeck] = useState(null);            // NUEVO ESTADO

  const [newCard, setNewCard] = useState({
    chinese: '',
    pinyin: '',
    english: '',
    difficulty: 'easy',
    deckId: '',
    deckName: '',
    cardType: 'basic',
    imageUrl: '',
    audioUrl: '',
    correctOption: '',
    wrongOption1: '',
    wrongOption2: ''
  });

  // Estado para crear nuevo mazo
  const [newDeck, setNewDeck] = useState({
    name: '',
    description: '',
    color: '#007bff',
    icon: '📚'
  });

  // NUEVO: Estado para editar mazo existente
  const [editDeck, setEditDeck] = useState({
    name: '',
    description: '',
    color: '#007bff',
    icon: '📚'
  });

  // Actualizar deckId seleccionado cuando cambie el mazo actual
  useEffect(() => {
    if (currentDeck && !selectedDeckId) {
      setSelectedDeckId(currentDeck.id);
    }
  }, [currentDeck, selectedDeckId]);

  // Tipos de tarjetas disponibles
  const cardTypes = [
  { 
    value: 'basic', 
    label: '📚 Básica (Chino → Inglés)',
    description: 'Anverso: Chino | Reverso: Inglés'
  },
  { 
    value: 'basic-reverse', 
    label: '📚 Básica Invertida (Inglés → Chino)',
    description: 'Anverso: Inglés | Reverso: Chino'
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

  const availableIcons = ['📚', '🎯', '🧠', '💡', '🚀', '⭐', '🔥', '💪', '🎨', '🔬','⛩️'];
  const availableColors = [
    '#007bff', '#28a745', '#dc3545', '#ffc107', 
    '#6f42c1', '#fd7e14', '#20c997', '#e83e8c','#00bcd4 ','#8bc34a'
  ];

  // Crear mazo automáticamente si no existen
  const handleCreateFirstDeck = async () => {
    try {
      const firstDeck = {
        name: '📚 Mi Primer Mazo',
        description: 'Mazo creado automáticamente para comenzar',
        color: '#007bff',
        icon: '📚'
      };
      
      const createdDeck = await onAddDeck(firstDeck);
      setSelectedDeckId(createdDeck.id);
      await onSwitchDeck(createdDeck);
      
      alert('¡Se ha creado tu primer mazo! Ahora puedes agregar tarjetas.');
      return createdDeck;
    } catch (error) {
      console.error('Error creating first deck:', error);
      alert('Error al crear el mazo. Por favor intenta de nuevo.');
      return null;
    }
  };

  // Crear nuevo mazo personalizado
  
  const handleCreateCustomDeck = async (e) => {
    e.preventDefault();
    if (!newDeck.name.trim()) {
      alert('Por favor ingresa un nombre para el mazo');
      return;
    }

    try {
      const createdDeck = await onAddDeck(newDeck);
      setSelectedDeckId(createdDeck.id);
      
      // Limpiar formulario
      setNewDeck({
        name: '',
        description: '',
        color: '#007bff',
        icon: '📚'
      });
      
      setShowCreateDeckForm(false);
      alert(`¡Mazo "${createdDeck.name}" creado exitosamente!`);
      
      return createdDeck;
    } catch (error) {
      console.error('Error creating custom deck:', error);
      alert('Error al crear el mazo. Por favor intenta de nuevo.');
    }
  };

  // NUEVA FUNCIÓN: Editar mazo existente
  const handleEditDeck = async (e) => {
    e.preventDefault();
    if (!editDeck.name.trim()) {
      alert('Por favor ingresa un nombre para el mazo');
      return;
    }

    try {
      await onEditDeck(editingDeck.id, editDeck);
      
      // Limpiar formulario
      setEditDeck({
        name: '',
        description: '',
        color: '#007bff',
        icon: '📚'
      });
      
      setShowEditDeckForm(false);
      setEditingDeck(null);
      alert(`¡Mazo "${editDeck.name}" actualizado exitosamente!`);
    } catch (error) {
      console.error('Error updating deck:', error);
      alert('Error al actualizar el mazo. Por favor intenta de nuevo.');
    }
  };

  // NUEVA FUNCIÓN: Eliminar mazo
  const handleDeleteDeck = async (deck) => {
    const deckCards = cards.filter(card => card.deckId === deck.id);
    
    if (deckCards.length > 0) {
      const confirmDelete = window.confirm(
        `⚠️ ATENCIÓN: El mazo "${deck.name}" contiene ${deckCards.length} tarjeta(s).\n\n` +
        `¿Estás seguro de que quieres eliminar este mazo?\n` +
        `Todas las tarjetas del mazo también serán eliminadas.\n\n` +
        `Esta acción NO se puede deshacer.`
      );
      
      if (!confirmDelete) return;
    } else {
      const confirmDelete = window.confirm(
        `¿Estás seguro de que quieres eliminar el mazo "${deck.name}"?`
      );
      
      if (!confirmDelete) return;
    }

    try {
      await onDeleteDeck(deck.id);
      alert(`Mazo "${deck.name}" eliminado exitosamente.`);
    } catch (error) {
      console.error('Error deleting deck:', error);
      alert(`Error al eliminar el mazo: ${error.message}`);
    }
  };

  // NUEVA FUNCIÓN: Preparar edición de mazo
  const handleStartEditDeck = (deck) => {
    setEditingDeck(deck);
    setEditDeck({
      name: deck.name,
      description: deck.description || '',
      color: deck.color || '#007bff',
      icon: deck.icon || '📚'
    });
    setShowEditDeckForm(true);
  };

  // NUEVA FUNCIÓN: Cancelar edición de mazo
  const handleCancelEditDeck = () => {
    setEditingDeck(null);
    setEditDeck({
      name: '',
      description: '',
      color: '#007bff',
      icon: '📚'
    });
    setShowEditDeckForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verificar que hay mazos disponibles
    if (!decks || decks.length === 0) {
      const createdDeck = await handleCreateFirstDeck();
      if (!createdDeck) return;
    }

    // Obtener el mazo seleccionado
    const targetDeckId = selectedDeckId || currentDeck?.id || decks[0]?.id;
    const targetDeck = decks.find(d => d.id === targetDeckId);
    
    if (!targetDeck) {
      alert('Error: No se pudo encontrar el mazo seleccionado');
      return;
    }

    // Validaciones específicas por tipo de tarjeta
    switch (newCard.cardType) {
      case 'basic':
      case 'basic-reverse':  // AGREGAR ESTA LÍNEA

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

    if (editingCard) {
      // Editar tarjeta existente
      const updatedCard = {
        ...editingCard,
        ...newCard,
        deckId: targetDeck.id,
        deckName: targetDeck.name,
        // Mantener los datos de revisión existentes
        id: editingCard.id,
        createdAt: editingCard.createdAt,
        lastReviewed: editingCard.lastReviewed,
        nextReview: editingCard.nextReview,
        interval: editingCard.interval,
        easeFactor: editingCard.easeFactor,
        repetitions: editingCard.repetitions,
        isNew: editingCard.isNew
      };

      onEditCard(updatedCard);
      alert('¡Tarjeta editada exitosamente!');
      setEditingCard(null);
    } else {
      // Crear nueva tarjeta
      const card = {
        id: Date.now(),
        ...newCard,
        deckId: targetDeck.id,
        deckName: targetDeck.name,
        createdAt: new Date(),
        lastReviewed: null,
        nextReview: new Date(),
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        isNew: true
      };

      onAddCard(card);
      alert('¡Tarjeta agregada exitosamente!');
    }
    
    // Limpiar formulario pero mantener mazo seleccionado
    setNewCard({
      chinese: '',
      pinyin: '',
      english: '',
      difficulty: 'easy',
      deckId: targetDeck.id,
      deckName: targetDeck.name,
      cardType: newCard.cardType,
      imageUrl: '',
      audioUrl: '',
      correctOption: '',
      wrongOption1: '',
      wrongOption2: ''
    });
    
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCard(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDeckChange = (e) => {
    const deckId = e.target.value;
    setSelectedDeckId(deckId);
    
    if (deckId && deckId !== 'create-new') {
      const selectedDeck = decks.find(d => d.id === deckId);
      if (selectedDeck && selectedDeck.id !== currentDeck?.id) {
        onSwitchDeck(selectedDeck);
      }
    }
  };

  const handleDelete = (cardId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarjeta?')) {
      onDeleteCard(cardId);
    }
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setSelectedDeckId(card.deckId);
    setNewCard({
      chinese: card.chinese || '',
      pinyin: card.pinyin || '',
      english: card.english || '',
      difficulty: card.difficulty || 'easy',
      deckId: card.deckId || '',
      deckName: card.deckName || '',
      cardType: card.cardType || 'basic',
      imageUrl: card.imageUrl || '',
      audioUrl: card.audioUrl || '',
      correctOption: card.correctOption || '',
      wrongOption1: card.wrongOption1 || '',
      wrongOption2: card.wrongOption2 || ''
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setShowForm(false);
    setSelectedDeckId(currentDeck?.id || null);
    setNewCard({
      chinese: '',
      pinyin: '',
      english: '',
      difficulty: 'easy',
      deckId: '',
      deckName: '',
      cardType: 'basic',
      imageUrl: '',
      audioUrl: '',
      correctOption: '',
      wrongOption1: '',
      wrongOption2: ''
    });
  };

  const getCardTypeIcon = (cardType) => {
    const icons = {
      'basic': '📚',
      'basic-reverse': '📚↩️',  // AGREGAR ESTA LÍNEA
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
      case 'basic-reverse':
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

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>⏳</div>
        <p>Cargando mazos y tarjetas...</p>
      </div>
    );
  }

  // Filtrar tarjetas del mazo actual
  const currentDeckCards = cards.filter(card => card.deckId === currentDeck?.id) || [];

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
          {currentDeck ? (
            <>
              {currentDeck.icon} {currentDeck.name} ({currentDeckCards.length})
            </>
          ) : (
            'Mis Tarjetas'
          )}
        </h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* NUEVO: Botón para gestionar mazos */}
          <button
            onClick={() => setShowDeckManager(!showDeckManager)}
            style={{
              backgroundColor: showDeckManager ? '#ffc107' : '#6f42c1',
              color: showDeckManager ? '#000' : 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
          >
            {showDeckManager ? '❌ Cerrar' : '🗂️ Gestionar Mazos'}
          </button>
          
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
            {showForm ? '❌ Cerrar' : '➕ Agregar Tarjeta'}
          </button>
        </div>
      </div>

      {/* NUEVA SECCIÓN: Gestión de mazos */}
      {showDeckManager && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '25px',
          border: '1px solid #dee2e6',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: 0, color: '#495057' }}>🗂️ Gestión de Mazos</h3>
            
            <button
              onClick={() => setShowCreateDeckForm(true)}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              ➕ Crear Nuevo Mazo
            </button>
          </div>

          {decks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📚</div>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#856404' }}>
                No hay mazos creados
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
                Crea tu primer mazo para organizar tus tarjetas
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {decks.map((deck) => {
                const deckCards = cards.filter(card => card.deckId === deck.id);
                const isCurrentDeck = currentDeck?.id === deck.id;
                
                return (
                  <div
                    key={deck.id}
                    style={{
                      backgroundColor: isCurrentDeck ? '#e3f2fd' : 'white',
                      border: `2px solid ${isCurrentDeck ? deck.color : '#dee2e6'}`,
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: isCurrentDeck ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          backgroundColor: deck.color,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px'
                        }}>
                          {deck.icon}
                        </div>
                        
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#333' }}>
                            {deck.name}
                            {isCurrentDeck && <span style={{ marginLeft: '8px', fontSize: '14px', color: deck.color }}>✓ Actual</span>}
                          </h4>
                          {deck.description && (
                            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6c757d' }}>
                              {deck.description}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#6c757d' }}>
                            <span>📚 {deckCards.length} tarjetas</span>
                            <span>📅 Creado: {new Date(deck.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {!isCurrentDeck && (
                          <button
                            onClick={() => onSwitchDeck(deck)}
                            style={{
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                            title="Cambiar a este mazo"
                          >
                            🔄 Usar
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleStartEditDeck(deck)}
                          style={{
                            backgroundColor: '#ffc107',
                            color: '#000',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                          title="Editar mazo"
                        >
                          ✏️ Editar
                        </button>


                        {/* estado protegido */}
                        {decks.length > 1 ? (
  <button
    onClick={() => handleDeleteDeck(deck)}
    style={{
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      padding: '8px 12px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 'bold'
    }}
    title="Eliminar mazo"
  >
    🗑️ Eliminar
  </button>
) : (
  <span style={{
    fontSize: '11px',
    color: '#6c757d',
    padding: '8px 12px',
    backgroundColor: '#e9ecef',
    borderRadius: '6px'
  }}>
    🔒 Último mazo
  </span>
)}
                        {/* ESTADO PROTEGIDO */}


                        {deck.id === 'default' && (
                          <span style={{
                            fontSize: '11px',
                            color: '#6c757d',
                            padding: '8px 12px',
                            backgroundColor: '#e9ecef',
                            borderRadius: '6px'
                          }}>
                            🔒 Protegido
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
            {editingCard ? '✏️ Editar Tarjeta' : '➕ Nueva Tarjeta'}
          </h3>

          {/* Selector de mazo */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
              🗂️ Mazo de destino *
            </label>
            
            {!decks || decks.length === 0 ? (
              <div style={{
                padding: '15px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#856404' }}>
                  ⚠️ No tienes mazos creados
                </p>
                <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#856404' }}>
                  Para crear tarjetas necesitas al menos un mazo. Se creará automáticamente cuando agregues tu primera tarjeta.
                </p>
              </div>
            ) : (
              <>
                <select
                  value={selectedDeckId || ''}
                  onChange={handleDeckChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #ced4da',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white'
                  }}
                  required
                >
                  <option value="">Selecciona un mazo</option>
                  {decks.map(deck => (
                    <option key={deck.id} value={deck.id}>
                      {deck.icon} {deck.name} ({cards.filter(c => c.deckId === deck.id).length} cartas)
                    </option>
                  ))}
                  <option value="create-new">➕ Crear nuevo mazo...</option>
                </select>
                
                {selectedDeckId === 'create-new' && (
                  <button
                    type="button"
                    onClick={() => setShowCreateDeckForm(true)}
                    style={{
                      marginTop: '10px',
                      padding: '10px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    🏗️ Crear nuevo mazo
                  </button>
                )}
              </>
            )}
          </div>

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

          {/* Campo de dificultad */}
          <div style={{ marginBottom: '20px' }}>
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

          <div style={{ display: 'flex', gap: '15px' }}>
            <button
              type="submit"
              style={{
                backgroundColor: editingCard ? '#ffc107' : '#28a745',
                color: editingCard ? '#000' : 'white',
                border: 'none',
                padding: '15px 40px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: editingCard ? '0 4px 15px rgba(255, 193, 7, 0.3)' : '0 4px 15px rgba(40, 167, 69, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {editingCard ? '✏️ Actualizar Tarjeta' : '💾 Guardar Tarjeta'}
            </button>

            {editingCard && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '15px 40px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
              >
                ❌ Cancelar Edición
              </button>
            )}
          </div>
        </form>
      )}

      {/* Modal para crear nuevo mazo */}
      {showCreateDeckForm && (
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
            onSubmit={handleCreateCustomDeck}
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}
          >
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>🏗️ Crear Nuevo Mazo</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                Nombre del mazo *
              </label>
              <input
                type="text"
                value={newDeck.name}
                onChange={(e) => setNewDeck(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Vocabulario HSK 1"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                Descripción (opcional)
              </label>
              <textarea
                value={newDeck.description}
                onChange={(e) => setNewDeck(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del mazo"
                rows="2"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                  Icono:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {availableIcons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewDeck(prev => ({ ...prev, icon }))}
                      style={{
                        padding: '8px',
                        border: newDeck.icon === icon ? '2px solid #007bff' : '1px solid #ddd',
                        borderRadius: '6px',
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

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                  Color:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {availableColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewDeck(prev => ({ ...prev, color }))}
                      style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: color,
                        border: newDeck.color === color ? '3px solid #333' : '1px solid #ddd',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowCreateDeckForm(false);
                  setSelectedDeckId(currentDeck?.id || '');
                }}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                🏗️ Crear Mazo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NUEVO: Modal para editar mazo */}
      {showEditDeckForm && editingDeck && (
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
            onSubmit={handleEditDeck}
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}
          >
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>
              ✏️ Editar Mazo: {editingDeck.name}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                Nombre del mazo *
              </label>
              <input
                type="text"
                value={editDeck.name}
                onChange={(e) => setEditDeck(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Vocabulario HSK 1"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                Descripción (opcional)
              </label>
              <textarea
                value={editDeck.description}
                onChange={(e) => setEditDeck(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del mazo"
                rows="2"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                  Icono:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {availableIcons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setEditDeck(prev => ({ ...prev, icon }))}
                      style={{
                        padding: '8px',
                        border: editDeck.icon === icon ? '2px solid #007bff' : '1px solid #ddd',
                        borderRadius: '6px',
                        backgroundColor: editDeck.icon === icon ? '#e3f2fd' : 'white',
                        cursor: 'pointer',
                        fontSize: '18px'
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                  Color:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {availableColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditDeck(prev => ({ ...prev, color }))}
                      style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: color,
                        border: editDeck.color === color ? '3px solid #333' : '1px solid #ddd',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancelEditDeck}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#ffc107',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                ✏️ Actualizar Mazo
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginTop: '25px' }}>
        <h3 style={{ color: '#495057', marginBottom: '15px' }}>
          Lista de Tarjetas {currentDeck && `- ${currentDeck.name}`}
        </h3>
        {currentDeckCards.length === 0 ? (
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
              {currentDeck ? `No hay tarjetas en ${currentDeck.name}` : 'No hay tarjetas aún'}
            </p>
            <p style={{ margin: 0, fontSize: '14px' }}>
              ¡Agrega tu primera tarjeta para comenzar a aprender!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {currentDeckCards.map((card) => (
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
                    <span>Mazo: {card.deckName || 'Sin mazo'}</span>
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
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleEdit(card)}
                    style={{
                      backgroundColor: '#ffc107',
                      color: '#000',
                      border: 'none',
                      padding: '10px 15px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease'
                    }}
                    title="Editar tarjeta"
                  >
                    ✏️ Editar
                  </button>
                  
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estadísticas por tipo de tarjeta */}
      {currentDeckCards.length > 0 && (
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
              const count = currentDeckCards.filter(card => card.cardType === type.value).length;
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

      {/* Resumen del mazo actual */}
      {currentDeck && (
        <div style={{
          marginTop: '25px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: `2px solid ${currentDeck.color}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: currentDeck.color,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              {currentDeck.icon}
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
                {currentDeck.name}
              </h4>
              {currentDeck.description && (
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6c757d' }}>
                  {currentDeck.description}
                </p>
              )}
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '15px',
            marginTop: '15px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: currentDeck.color }}>
                {currentDeckCards.length}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                Tarjetas totales
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                {cardTypes.length}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                Tipos disponibles
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardManager;