// src/pages/Practice.jsx - Versión con selección de mazos
import { useState, useEffect } from 'react';
import { SpacedRepetition } from '../services/spacedRepetition';

const Practice = ({ 
  cards = [], 
  userProgress = {}, 
  updateProgress = () => {}, 
  settings = {},
  // Nuevas props para mazos
  decks = [],
  currentDeck = null
}) => {
  // Estados para selección de mazo
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [showDeckSelection, setShowDeckSelection] = useState(true);
  
  // Estados originales de práctica
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyQueue, setStudyQueue] = useState([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [currentSide, setCurrentSide] = useState('front');
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    cardsStudied: 0,
    correctAnswers: 0,
    totalCards: 0
  });

  // Reiniciar selección de mazo al cambiar las cartas
  useEffect(() => {
    setShowDeckSelection(true);
    setSelectedDeck(null);
    setStudyQueue([]);
  }, [cards, decks]);

  // Función para seleccionar un mazo y comenzar el estudio
  const handleDeckSelection = (deck) => {
    setSelectedDeck(deck);
    setShowDeckSelection(false);
    
    // Filtrar cartas del mazo seleccionado
    const deckCards = cards.filter(card => card.deckId === deck.id);
    initializeStudySession(deckCards);
  };

  // Función para volver a la selección de mazos
  const backToDeckSelection = () => {
    setShowDeckSelection(true);
    setSelectedDeck(null);
    setStudyQueue([]);
    setCurrentCardIndex(0);
    resetCardState();
    setSessionStats({
      cardsStudied: 0,
      correctAnswers: 0,
      totalCards: 0
    });
  };

  const initializeStudySession = (deckCards) => {
    if (!deckCards || deckCards.length === 0) return;

    console.log('Inicializando sesión con cartas del mazo:', selectedDeck?.name, deckCards);

    // Obtener cartas que necesitan revisión del mazo seleccionado
    const cardsToStudy = SpacedRepetition.getCardsForReview(deckCards, userProgress);
    
    let finalQueue = [];
    
    // Si no hay cartas para revisar, agregar cartas nuevas del mazo
    if (cardsToStudy.length === 0) {
      const newCards = deckCards.filter(card => !userProgress[card.id]).slice(0, 10);
      finalQueue = newCards;
    } else {
      finalQueue = cardsToStudy;
    }

    console.log('Cola de estudio final para el mazo:', finalQueue);
    
    setStudyQueue(finalQueue);
    setSessionStats(prev => ({ 
      ...prev, 
      totalCards: finalQueue.length,
      cardsStudied: 0,
      correctAnswers: 0
    }));
    setCurrentCardIndex(0);
    resetCardState();
  };

  // Función para resetear el estado de la tarjeta actual
  const resetCardState = () => {
    setShowAnswer(false);
    setUserAnswer('');
    setSelectedOption('');
    setCurrentSide('front');
    setShuffledOptions([]);
  };

  const getCurrentCard = () => {
    if (!studyQueue || studyQueue.length === 0 || currentCardIndex >= studyQueue.length) {
      return null;
    }
    return studyQueue[currentCardIndex];
  };

  // Inicializar opciones aleatorias para tarjetas de reconocimiento de imagen
  useEffect(() => {
    const currentCard = getCurrentCard();
    if (currentCard && currentCard.cardType === 'image-recognition') {
      const options = [
        currentCard.correctOption,
        currentCard.wrongOption1,
        currentCard.wrongOption2
      ].sort(() => Math.random() - 0.5);
      setShuffledOptions(options);
    }
  }, [currentCardIndex, studyQueue]);

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleSubmitAnswer = () => {
    const currentCard = getCurrentCard();
    if (!currentCard) return;

    setShowAnswer(true);
  };

  const handleDifficultyResponse = (difficulty) => {
    const currentCard = getCurrentCard();
    if (!currentCard) return;

    console.log('Procesando dificultad:', difficulty, 'para carta:', currentCard.id);

    // Determinar si la respuesta fue correcta para estadísticas
    let isCorrect = false;
    switch (currentCard.cardType) {
      case 'basic-typing':
        isCorrect = userAnswer.trim().toLowerCase() === currentCard.chinese.toLowerCase();
        break;
      case 'image-recognition':
        isCorrect = selectedOption === currentCard.correctOption;
        break;
      case 'image-typing':
      case 'audio-typing':
        isCorrect = userAnswer.trim().toLowerCase() === currentCard.pinyin.toLowerCase();
        break;
      default:
        // Para tarjetas básicas, consideramos que es correcta si no es 'hard'
        isCorrect = difficulty !== 'hard';
    }

    // Calcular nueva fecha de revisión usando el algoritmo de repetición espaciada
    const currentProgress = userProgress[currentCard.id] || { 
      level: 0, 
      lastReviewed: null, 
      interval: 0,
      totalReviews: 0
    };

    const newReviewData = SpacedRepetition.calculateNextReview(currentProgress, difficulty);

    // Actualizar progreso del usuario
    updateProgress(currentCard.id, {
      ...newReviewData,
      lastReviewed: new Date().toISOString(),
      totalReviews: currentProgress.totalReviews + 1,
      difficulty: difficulty
    });

    // Actualizar estadísticas de la sesión
    setSessionStats(prev => ({
      ...prev,
      cardsStudied: prev.cardsStudied + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0)
    }));

    // Avanzar a la siguiente carta
    handleNextCard();
  };

  const handleNextCard = () => {
    console.log('Avanzando carta. Índice actual:', currentCardIndex, 'Total:', studyQueue.length);
    
    if (currentCardIndex < studyQueue.length - 1) {
      const nextIndex = currentCardIndex + 1;
      console.log('Avanzando a índice:', nextIndex);
      setCurrentCardIndex(nextIndex);
      resetCardState();
    } else {
      // Sesión completada
      console.log('Sesión completada');
      handleSessionComplete();
    }
  };

  const handleSessionComplete = () => {
    const accuracy = sessionStats.cardsStudied > 0 
      ? Math.round((sessionStats.correctAnswers / sessionStats.cardsStudied) * 100) 
      : 0;
    
    alert(`¡Sesión completada!\n\nCartas estudiadas: ${sessionStats.cardsStudied}\nPrecisión: ${accuracy}%`);
    
    // Volver a la selección de mazos
    backToDeckSelection();
  };

  const playAudio = (audioUrl) => {
    if (!audioUrl) return;
    
    try {
      const audio = new Audio(audioUrl);
      audio.play().catch(e => console.log('Error playing audio:', e));
    } catch (e) {
      console.log('Error creating audio:', e);
    }
  };

  const flipCard = () => {
    setCurrentSide(currentSide === 'front' ? 'back' : 'front');
  };

  // Función para determinar si una respuesta es correcta automáticamente
  const getAutomaticCorrectness = (currentCard) => {
    switch (currentCard.cardType) {
      case 'basic-typing':
        return userAnswer.trim().toLowerCase() === currentCard.chinese.toLowerCase();
      case 'image-recognition':
        return selectedOption === currentCard.correctOption;
      case 'image-typing':
      case 'audio-typing':
        return userAnswer.trim().toLowerCase() === currentCard.pinyin.toLowerCase();
      default:
        return null;
    }
  };

  // Calcular estadísticas de mazos
  const getDecksWithStats = () => {
    return decks.map(deck => {
      const deckCards = cards.filter(card => card.deckId === deck.id);
      const cardsForReview = SpacedRepetition.getCardsForReview(deckCards, userProgress);
      const newCards = deckCards.filter(card => !userProgress[card.id]);
      
      return {
        ...deck,
        cardCount: deckCards.length,
        cardsForReview: cardsForReview.length,
        newCards: newCards.length
      };
    });
  };

  // RENDERIZAR SELECCIÓN DE MAZOS
  if (showDeckSelection) {
    const decksWithStats = getDecksWithStats();
    
    return (
      <div className="practice-container">
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '20px'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            <h1 style={{
              fontSize: '2.5em',
              marginBottom: '10px',
              color: '#2c3e50'
            }}>
              🧠 Práctica
            </h1>
            <p style={{
              fontSize: '1.1em',
              color: '#7f8c8d',
              marginBottom: '0'
            }}>
              Selecciona el mazo que quieres estudiar
            </p>
          </div>

          {decksWithStats.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '2px dashed #dee2e6'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
              <h3 style={{ color: '#6c757d', marginBottom: '8px' }}>No hay mazos disponibles</h3>
              <p style={{ color: '#6c757d', margin: '0' }}>
                Crea algunos mazos y añade cartas para comenzar a estudiar.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {decksWithStats.map(deck => (
                <div
                  key={deck.id}
                  onClick={() => {
                    if (deck.cardCount > 0) {
                      handleDeckSelection(deck);
                    }
                  }}
                  style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: `2px solid ${deck.color}20`,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    cursor: deck.cardCount > 0 ? 'pointer' : 'not-allowed',
                    opacity: deck.cardCount > 0 ? 1 : 0.6,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (deck.cardCount > 0) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* Barra de color superior */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: deck.color
                  }} />
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      fontSize: '2em',
                      lineHeight: 1
                    }}>
                      {deck.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        margin: '0 0 4px 0',
                        fontSize: '1.3em',
                        color: '#2c3e50'
                      }}>
                        {deck.name}
                      </h3>
                      {deck.description && (
                        <p style={{
                          margin: '0',
                          fontSize: '0.9em',
                          color: '#7f8c8d',
                          lineHeight: '1.4'
                        }}>
                          {deck.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      textAlign: 'center',
                      padding: '8px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px'
                    }}>
                      <div style={{
                        fontSize: '1.2em',
                        fontWeight: 'bold',
                        color: '#2c3e50'
                      }}>
                        {deck.cardCount}
                      </div>
                      <div style={{
                        fontSize: '0.8em',
                        color: '#7f8c8d'
                      }}>
                        Total
                      </div>
                    </div>
                    
                    <div style={{
                      textAlign: 'center',
                      padding: '8px',
                      backgroundColor: deck.cardsForReview > 0 ? '#fff3cd' : '#f8f9fa',
                      borderRadius: '6px'
                    }}>
                      <div style={{
                        fontSize: '1.2em',
                        fontWeight: 'bold',
                        color: deck.cardsForReview > 0 ? '#856404' : '#2c3e50'
                      }}>
                        {deck.cardsForReview}
                      </div>
                      <div style={{
                        fontSize: '0.8em',
                        color: deck.cardsForReview > 0 ? '#856404' : '#7f8c8d'
                      }}>
                        Revisar
                      </div>
                    </div>
                    
                    <div style={{
                      textAlign: 'center',
                      padding: '8px',
                      backgroundColor: deck.newCards > 0 ? '#d1ecf1' : '#f8f9fa',
                      borderRadius: '6px'
                    }}>
                      <div style={{
                        fontSize: '1.2em',
                        fontWeight: 'bold',
                        color: deck.newCards > 0 ? '#0c5460' : '#2c3e50'
                      }}>
                        {deck.newCards}
                      </div>
                      <div style={{
                        fontSize: '0.8em',
                        color: deck.newCards > 0 ? '#0c5460' : '#7f8c8d'
                      }}>
                        Nuevas
                      </div>
                    </div>
                  </div>

                  {/* Estado del mazo */}
                  {deck.cardCount === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '8px',
                      backgroundColor: '#f8d7da',
                      color: '#721c24',
                      borderRadius: '6px',
                      fontSize: '0.9em'
                    }}>
                      Sin cartas disponibles
                    </div>
                  ) : deck.cardsForReview === 0 && deck.newCards === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '8px',
                      backgroundColor: '#d4edda',
                      color: '#155724',
                      borderRadius: '6px',
                      fontSize: '0.9em'
                    }}>
                      ✅ Todas las cartas al día
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '8px',
                      backgroundColor: deck.color + '20',
                      color: deck.color,
                      borderRadius: '6px',
                      fontSize: '0.9em',
                      fontWeight: '500'
                    }}>
                      🎯 ¡Listo para estudiar!
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // RESTO DEL CÓDIGO ORIGINAL PARA LA PRÁCTICA
  // [Todo el código de renderizado de tarjetas permanece igual...]

  // Renderizar el contenido de la tarjeta según su tipo
  const renderCardContent = (currentCard) => {
    if (!currentCard) return null;

    switch (currentCard.cardType) {
      case 'basic':
        return (
          <div className="flashcard">
            <div className="card-content">
              <div className="card-category">{currentCard.category}</div>
              {currentSide === 'front' ? (
                <div className="card-front">
                  <h2>{currentCard.chinese}</h2>
                  <p>¿Qué significa en inglés?</p>
                </div>
              ) : (
                <div className="card-back">
                  <h2>{currentCard.english}</h2>
                  {settings.showPinyin && <p className="pinyin">{currentCard.pinyin}</p>}
                </div>
              )}
              <button className="btn-secondary" onClick={flipCard}>
                🔄 Voltear tarjeta
              </button>
            </div>
          </div>
        );
        case 'basic-reverse':  // AGREGAR ESTE CASO COMPLETO
  return (
    <div className="flashcard">
      <div className="card-content">
        <div className="card-category">{currentCard.category}</div>
        {currentSide === 'front' ? (
          <div className="card-front">
            <h2>{currentCard.english}</h2>
            <p>¿Qué significa en chino?</p>
          </div>
        ) : (
          <div className="card-back">
            <h2>{currentCard.chinese}</h2>
            {settings.showPinyin && <p className="pinyin">{currentCard.pinyin}</p>}
          </div>
        )}
        <button className="btn-secondary" onClick={flipCard}>
          🔄 Voltear tarjeta
        </button>
      </div>
    </div>
  );
      case 'basic-typing':
        return (
          <div className="flashcard">
            <div className="card-content">
              <div className="card-category">{currentCard.category}</div>
              <div className="card-front">
                <h2>{currentCard.english}</h2>
                <p>Traduce al chino</p>
                {!showAnswer && (
                  <div className="answer-input">
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Escribe tu respuesta..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '18px',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}
                    />
                  </div>
                )}
              </div>
              {showAnswer && (
                <div className="card-back">
                  <h2 style={{ 
                    color: getAutomaticCorrectness(currentCard) ? 'green' : 'red' 
                  }}>
                    {currentCard.chinese}
                  </h2>
                  {settings.showPinyin && <p className="pinyin">{currentCard.pinyin}</p>}
                  <div className="user-answer">
                    Tu respuesta: <strong>{userAnswer}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'image-recognition':
        return (
          <div className="flashcard">
            <div className="card-content">
              <div className="card-category">{currentCard.category}</div>
              <div className="card-front">
                <div className="image-container">
                  <img 
                    src={currentCard.imageUrl} 
                    alt="Carácter chino"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      objectFit: 'contain'
                    }}
                  />
                </div>
                <p>¿Qué significa este carácter?</p>
                {!showAnswer && (
                  <div className="multiple-choice">
                    {shuffledOptions.map((option, index) => (
                      <button
                        key={index}
                        className={`option-btn ${selectedOption === option ? 'selected' : ''}`}
                        onClick={() => setSelectedOption(option)}
                        style={{
                          display: 'block',
                          width: '100%',
                          margin: '8px 0',
                          padding: '12px',
                          fontSize: '16px',
                          border: '2px solid #ddd',
                          borderRadius: '8px',
                          backgroundColor: selectedOption === option ? '#007bff' : 'white',
                          color: selectedOption === option ? 'white' : 'black',
                          cursor: 'pointer'
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {showAnswer && (
                <div className="card-back">
                  <h2 style={{ 
                    color: getAutomaticCorrectness(currentCard) ? 'green' : 'red' 
                  }}>
                    Respuesta correcta: {currentCard.correctOption}
                  </h2>
                  {settings.showPinyin && <p className="pinyin">{currentCard.pinyin}</p>}
                  <div className="user-answer">
                    Tu respuesta: <strong>{selectedOption}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'image-typing':
        return (
          <div className="flashcard">
            <div className="card-content">
              <div className="card-category">{currentCard.category}</div>
              <div className="card-front">
                <div className="image-container">
                  <img 
                    src={currentCard.imageUrl} 
                    alt="Carácter chino"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      objectFit: 'contain'
                    }}
                  />
                </div>
                <p>Escribe el pinyin de este carácter</p>
                {!showAnswer && (
                  <div className="answer-input">
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Escribe el pinyin..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '18px',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}
                    />
                  </div>
                )}
              </div>
              {showAnswer && (
                <div className="card-back">
                  <h2 style={{ 
                    color: getAutomaticCorrectness(currentCard) ? 'green' : 'red' 
                  }}>
                    {currentCard.pinyin}
                  </h2>
                  <div className="user-answer">
                    Tu respuesta: <strong>{userAnswer}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'audio-typing':
        return (
          <div className="flashcard">
            <div className="card-content">
              <div className="card-category">{currentCard.category}</div>
              <div className="card-front">
                <div className="audio-container">
                  <button 
                    className="audio-btn-large" 
                    onClick={() => playAudio(currentCard.audioUrl)}
                    style={{
                      fontSize: '48px',
                      padding: '20px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    🔊
                  </button>
                </div>
                <p>Escribe lo que escuchas en pinyin</p>
                {!showAnswer && (
                  <div className="answer-input">
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Escribe lo que escuchas..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '18px',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}
                    />
                  </div>
                )}
              </div>
              {showAnswer && (
                <div className="card-back">
                  <h2 style={{ 
                    color: getAutomaticCorrectness(currentCard) ? 'green' : 'red' 
                  }}>
                    {currentCard.pinyin}
                  </h2>
                  <div className="user-answer">
                    Tu respuesta: <strong>{userAnswer}</strong>
                  </div>
                  <button 
                    className="audio-btn" 
                    onClick={() => playAudio(currentCard.audioUrl)}
                    style={{
                      marginTop: '10px',
                      padding: '8px 16px',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🔊 Reproducir otra vez
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return <div>Tipo de tarjeta no soportado: {currentCard.cardType}</div>;
    }
  };

  // Si no hay cartas en la cola de estudio
  if (!studyQueue || studyQueue.length === 0) {
    return (
      <div className="practice-container">
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <div style={{ fontSize: '72px', marginBottom: '20px' }}>🎉</div>
          <h2 style={{ marginBottom: '16px', color: '#2c3e50' }}>
            ¡Bien hecho!
          </h2>
          <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
            No hay cartas para revisar en <strong>{selectedDeck?.name}</strong> en este momento.
          </p>
          <p style={{ color: '#7f8c8d', marginBottom: '30px', fontSize: '0.9em' }}>
            Vuelve más tarde para continuar tu aprendizaje.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              className="btn-primary" 
              onClick={backToDeckSelection}
              style={{
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1em'
              }}
            >
              ← Elegir otro mazo
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => {
                const deckCards = cards.filter(card => card.deckId === selectedDeck?.id);
                initializeStudySession(deckCards);
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: 'white',
                color: '#007bff',
                border: '2px solid #007bff',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1em'
              }}
            >
              🔄 Buscar más cartas
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = getCurrentCard();
  if (!currentCard) {
    return (
      <div className="practice-container">
        <div className="no-cards-message">
          <h2>Error al cargar la tarjeta</h2>
          <p>No se pudo cargar la tarjeta actual del mazo <strong>{selectedDeck?.name}</strong>.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={backToDeckSelection}>
              ← Elegir otro mazo
            </button>
            <button className="btn-secondary" onClick={() => {
              const deckCards = cards.filter(card => card.deckId === selectedDeck?.id);
              initializeStudySession(deckCards);
            }}>
              Reiniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentCardIndex + 1) / studyQueue.length) * 100;

  return (
    <div className="practice-container">
      {/* Header con información del mazo seleccionado */}
      <div className="practice-header">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <button 
            onClick={backToDeckSelection}
            style={{
              padding: '8px 12px',
              backgroundColor: 'white',
              color: '#007bff',
              border: '1px solid #007bff',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ← Cambiar mazo
          </button>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '1.1em',
            fontWeight: '500'
          }}>
            <span style={{ fontSize: '1.2em' }}>{selectedDeck?.icon}</span>
            <span>{selectedDeck?.name}</span>
          </div>
        </div>

        <div className="progress-bar" style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '12px'
        }}>
          <div 
            className="progress-fill" 
            style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: selectedDeck?.color || '#007bff',
              transition: 'width 0.3s ease'
            }}
          ></div>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.9em',
          color: '#6c757d'
        }}>
          <span>Carta {currentCardIndex + 1} de {studyQueue.length}</span>
          <div className="session-stats" style={{ display: 'flex', gap: '16px' }}>
            <span>Estudiadas: <strong>{sessionStats.cardsStudied}</strong></span>
            <span>
              Precisión: <strong>{sessionStats.cardsStudied > 0 ? Math.round((sessionStats.correctAnswers / sessionStats.cardsStudied) * 100) : 0}%</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="flashcard-container">
        {renderCardContent(currentCard)}

        <div className="practice-buttons">
          {/* Botones para tarjetas básicas */}
          {(currentCard.cardType === 'basic' || currentCard.cardType === 'basic-reverse') && (  // MODIFICAR ESTA LÍNEA
            <>
              {!showAnswer ? (
                <button className="btn-primary" onClick={handleShowAnswer}>
                  Mostrar Respuesta
                </button>
              ) : (
                <div className="difficulty-buttons">
                  <button 
                    className="btn-hard" 
                    onClick={() => handleDifficultyResponse('hard')}
                    title="No recordaba la respuesta"
                  >
                    Difícil
                  </button>
                  <button 
                    className="btn-medium" 
                    onClick={() => handleDifficultyResponse('medium')}
                    title="Recordé con esfuerzo"
                  >
                    Medio
                  </button>
                  <button 
                    className="btn-easy" 
                    onClick={() => handleDifficultyResponse('easy')}
                    title="Recordé fácilmente"
                  >
                    Fácil
                  </button>
                </div>
              )}
            </>
          )}

          {/* Botones para tarjetas que requieren respuesta */}
          {(['basic-typing', 'image-recognition', 'image-typing', 'audio-typing'].includes(currentCard.cardType)) && (
            <>
              {!showAnswer ? (
                <button 
                  className="btn-primary" 
                  onClick={handleSubmitAnswer}
                  disabled={
                    (currentCard.cardType === 'basic-typing' && !userAnswer.trim()) ||
                    (currentCard.cardType === 'image-recognition' && !selectedOption) ||
                    (currentCard.cardType === 'image-typing' && !userAnswer.trim()) ||
                    (currentCard.cardType === 'audio-typing' && !userAnswer.trim())
                  }
                >
                  Verificar Respuesta
                </button>
              ) : (
                <div className="difficulty-buttons">
                  <button 
                    className="btn-hard" 
                    onClick={() => handleDifficultyResponse('hard')}
                    title="No recordaba la respuesta"
                  >
                    Difícil
                  </button>
                  <button 
                    className="btn-medium" 
                    onClick={() => handleDifficultyResponse('medium')}
                    title="Recordé con esfuerzo"
                  >
                    Medio
                  </button>
                  <button 
                    className="btn-easy" 
                    onClick={() => handleDifficultyResponse('easy')}
                    title="Recordé fácilmente"
                  >
                    Fácil
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Información de repetición espaciada */}
        {showAnswer && userProgress[currentCard.id] && (
          <div className="spaced-repetition-info" style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <small style={{ color: '#6c757d' }}>
              Nivel: <strong>{userProgress[currentCard.id].level || 0}</strong> | 
              Revisiones: <strong>{userProgress[currentCard.id].totalReviews || 0}</strong> |
              Última vez: <strong>{userProgress[currentCard.id].lastReviewed ? 
                new Date(userProgress[currentCard.id].lastReviewed).toLocaleDateString() : 
                'Primera vez'
              }</strong>
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default Practice;