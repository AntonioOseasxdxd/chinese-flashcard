// src/pages/Practice.js
import { useState, useEffect } from 'react';
import { SpacedRepetition } from '../services/spacedRepetition';

const Practice = ({ cards = [], userProgress = {}, updateProgress = () => {}, settings = {} }) => {
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

  // Inicializar cola de estudio cuando cambian las cartas
  useEffect(() => {
    initializeStudySession();
  }, [cards]);

  const initializeStudySession = () => {
    if (!cards || cards.length === 0) return;

    console.log('Inicializando sesión con cartas:', cards);

    // Obtener cartas que necesitan revisión de TODOS los tipos
    const cardsToStudy = SpacedRepetition.getCardsForReview(cards, userProgress);
    
    let finalQueue = [];
    
    // Si no hay cartas para revisar, agregar cartas nuevas de TODOS los tipos
    if (cardsToStudy.length === 0) {
      const newCards = cards.filter(card => !userProgress[card.id]).slice(0, 10);
      finalQueue = newCards;
    } else {
      finalQueue = cardsToStudy;
    }

    console.log('Cola de estudio final:', finalQueue);
    
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
    
    // Reinicializar para una nueva sesión
    initializeStudySession();
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

  // Debug: Agregar logs para verificar el estado
  console.log('Estado actual:', {
    currentCardIndex,
    studyQueueLength: studyQueue.length,
    currentCard: getCurrentCard(),
    showAnswer
  });

  // Si no hay cartas en la cola de estudio
  if (!studyQueue || studyQueue.length === 0) {
    return (
      <div className="practice-container">
        <div className="no-cards-message">
          <h2>¡Bien hecho! 🎉</h2>
          <p>No hay cartas para revisar en este momento.</p>
          <p>Vuelve más tarde para continuar tu aprendizaje.</p>
          <button className="btn-primary" onClick={initializeStudySession}>
            Buscar más cartas
          </button>
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
          <p>No se pudo cargar la tarjeta actual.</p>
          <button className="btn-primary" onClick={initializeStudySession}>
            Reiniciar sesión
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentCardIndex + 1) / studyQueue.length) * 100;

  return (
    <div className="practice-container">
      <div className="practice-header">
        <div className="progress-bar">
          <div className="progress-fill" style={{width: `${progress}%`}}></div>
        </div>
        <p>Carta {currentCardIndex + 1} de {studyQueue.length}</p>
        <div className="session-stats">
          <span>Estudiadas: {sessionStats.cardsStudied}</span>
          <span>Precisión: {sessionStats.cardsStudied > 0 ? Math.round((sessionStats.correctAnswers / sessionStats.cardsStudied) * 100) : 0}%</span>
        </div>
      </div>

      <div className="flashcard-container">
        {renderCardContent(currentCard)}

        <div className="practice-buttons">
          {/* Botones para tarjetas básicas */}
          {currentCard.cardType === 'basic' && (
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
          <div className="spaced-repetition-info">
            <small>
              Nivel: {userProgress[currentCard.id].level} | 
              Revisiones: {userProgress[currentCard.id].totalReviews || 0} |
              Última vez: {userProgress[currentCard.id].lastReviewed ? 
                new Date(userProgress[currentCard.id].lastReviewed).toLocaleDateString() : 
                'Primera vez'
              }
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default Practice;