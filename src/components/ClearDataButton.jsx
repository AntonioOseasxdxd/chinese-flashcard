// src/components/ClearDataButton.jsx
import React, { useState } from 'react';

const ClearDataButton = ({ onDataCleared }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const clearAllData = async () => {
    // Triple confirmación para evitar borrados accidentales
    if (!window.confirm('🚨 ¿Estás seguro de que quieres eliminar TODAS las flashcards?')) {
      return;
    }
    
    if (!window.confirm('⚠️ Esto incluye las 20 tarjetas predeterminadas. ¿Continuar?')) {
      return;
    }
    
    if (!window.confirm('🗑️ ÚLTIMA CONFIRMACIÓN: Se eliminarán absolutamente todas las tarjetas. ¿Proceder?')) {
      return;
    }

    setLoading(true);
    setMessage('Eliminando todas las flashcards...');

    try {
      // 1. Limpiar localStorage completamente
      localStorage.removeItem('chinese-flashcards-cards');
      localStorage.removeItem('chinese-flashcards-progress');
      localStorage.removeItem('chinese-flashcards-settings');
      localStorage.removeItem('chinese-flashcards-user');
      
      // Limpiar todo el localStorage relacionado
      Object.keys(localStorage).forEach(key => {
        if (key.includes('chinese') || key.includes('flashcard') || key.includes('firebase')) {
          localStorage.removeItem(key);
        }
      });

      // 2. Limpiar sessionStorage
      sessionStorage.clear();

      // 3. Si tienes acceso a Firebase, limpiarlo también
      try {
        // Intentar limpiar Firebase si está disponible
        if (window.firebase) {
          const db = window.firebase.firestore();
          const user = window.firebase.auth().currentUser;
          
          if (user) {
            await db.collection('users').doc(user.uid).collection('cards').get()
              .then(snapshot => {
                const batch = db.batch();
                snapshot.docs.forEach(doc => {
                  batch.delete(doc.ref);
                });
                return batch.commit();
              });
            
            await db.collection('users').doc(user.uid).collection('progress').get()
              .then(snapshot => {
                const batch = db.batch();
                snapshot.docs.forEach(doc => {
                  batch.delete(doc.ref);
                });
                return batch.commit();
              });
          }
        }
      } catch (firebaseError) {
        console.log('Firebase no disponible o error al limpiar:', firebaseError);
      }

      setMessage('✅ ¡Todas las flashcards eliminadas exitosamente!');
      
      // Notificar al componente padre
      if (onDataCleared) {
        onDataCleared();
      }

      // Recargar la página después de 2 segundos para asegurar estado limpio
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error al limpiar datos:', error);
      setMessage('❌ Error al eliminar datos. Intentando reload...');
      
      // Si hay error, forzar reload después de 3 segundos
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const forceReload = () => {
    if (window.confirm('🔄 ¿Forzar recarga de la aplicación? (Esto puede solucionar problemas de caché)')) {
      window.location.reload(true); // Forzar recarga sin caché
    }
  };

  return (
    <div style={{
      padding: '20px',
      margin: '20px auto',
      maxWidth: '500px',
      backgroundColor: '#fff3cd',
      border: '2px solid #ffeaa7',
      borderRadius: '12px',
      textAlign: 'center'
    }}>
      <h3 style={{ color: '#856404', marginBottom: '15px' }}>
        🗑️ Eliminar Todas las Flashcards
      </h3>

      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '15px',
          backgroundColor: message.includes('Error') || message.includes('❌') ? '#f8d7da' : '#d4edda',
          color: message.includes('Error') || message.includes('❌') ? '#721c24' : '#155724',
          borderRadius: '6px',
          border: `1px solid ${message.includes('Error') || message.includes('❌') ? '#f5c6cb' : '#c3e6cb'}`
        }}>
          {message}
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={clearAllData}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            opacity: loading ? 0.6 : 1,
            minWidth: '200px'
          }}
        >
          {loading ? '⏳ Eliminando...' : '🗑️ Eliminar TODAS las Tarjetas'}
        </button>

        <button
          onClick={forceReload}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            minWidth: '150px'
          }}
        >
          🔄 Forzar Recarga
        </button>
      </div>

      <div style={{
        marginTop: '15px',
        fontSize: '12px',
        color: '#856405',
        lineHeight: '1.4'
      }}>
        <p><strong>⚠️ ADVERTENCIA:</strong> Esto eliminará las 20 flashcards predeterminadas y todas las que hayas creado.</p>
        <p><strong>🔄 Forzar Recarga:</strong> Usa esto si las tarjetas siguen apareciendo después de eliminar.</p>
      </div>
    </div>
  );
};

export default ClearDataButton;