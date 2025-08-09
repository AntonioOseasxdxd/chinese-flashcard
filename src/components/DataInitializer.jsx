// src/components/DataInitializer.jsx
import React, { useState } from 'react';
import { FirebaseSync } from '../services/firebaseSync';

const DataInitializer = ({ onInitComplete }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const initializeData = async () => {
    setLoading(true);
    setMessage('Inicializando datos...');
    
    try {
      // Verificar si ya hay datos en Firebase
      const existingCards = await FirebaseSync.getCards();
      
      if (existingCards && existingCards.length > 0) {
        setMessage(`Ya tienes ${existingCards.length} cartas guardadas.`);
        onInitComplete?.(existingCards);
        return;
      }

      // CAMBIO: Ya no cargar tarjetas iniciales, solo inicializar vacío
      setMessage('Sistema inicializado sin tarjetas predeterminadas ✨');
      onInitComplete?.([]);
      
    } catch (error) {
      console.error('Error initializing data:', error);
      setMessage('Error al inicializar datos.');
      onInitComplete?.([]);
    } finally {
      setLoading(false);
    }
  };

  const resetData = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar TODAS las tarjetas? Esto no se puede deshacer.')) {
      return;
    }

    setLoading(true);
    setMessage('Eliminando todas las tarjetas...');
    
    try {
      // CAMBIO: Resetear a array vacío en lugar de tarjetas iniciales
      await FirebaseSync.syncCards([]);
      await FirebaseSync.syncProgress({});
      
      setMessage('¡Todas las tarjetas eliminadas! 🗑️✨');
      onInitComplete?.([]);
      
    } catch (error) {
      console.error('Error resetting data:', error);
      setMessage('Error al resetear datos.');
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    if (!window.confirm('🚨 ADVERTENCIA: Esto eliminará ABSOLUTAMENTE TODO (tarjetas, progreso, configuraciones). ¿Continuar?')) {
      return;
    }

    setLoading(true);
    setMessage('Eliminando absolutamente todo...');
    
    try {
      // Limpiar Firebase
      await FirebaseSync.syncCards([]);
      await FirebaseSync.syncProgress({});
      
      // Limpiar localStorage
      localStorage.clear();
      
      setMessage('¡Todo eliminado completamente! 🧹✨');
      onInitComplete?.([]);
      
      // Recargar la página para asegurar estado limpio
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error clearing all data:', error);
      setMessage('Error al limpiar todos los datos.');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const cards = await FirebaseSync.getCards();
      const progress = await FirebaseSync.getProgress();
      
      const data = {
        cards,
        progress,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chinese-flashcards-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage('¡Datos exportados correctamente! 📥');
    } catch (error) {
      console.error('Error exporting data:', error);
      setMessage('Error al exportar datos.');
    }
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '600px',
      margin: '20px auto',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      border: '1px solid #dee2e6',
      textAlign: 'center'
    }}>
      <h3 style={{ marginBottom: '20px', color: '#495057' }}>
        🔧 Configuración de Datos
      </h3>

      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
          color: message.includes('Error') ? '#721c24' : '#155724',
          borderRadius: '6px',
          border: `1px solid ${message.includes('Error') ? '#f5c6cb' : '#c3e6cb'}`
        }}>
          {message}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <button
          onClick={initializeData}
          disabled={loading}
          style={{
            padding: '12px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '⏳ Cargando...' : '🚀 Inicializar Sistema'}
        </button>

        <button
          onClick={resetData}
          disabled={loading}
          style={{
            padding: '12px 20px',
            backgroundColor: '#ffc107',
            color: '#212529',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '⏳ Eliminando...' : '🗑️ Eliminar Tarjetas'}
        </button>

        <button
          onClick={clearAllData}
          disabled={loading}
          style={{
            padding: '12px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '⏳ Limpiando...' : '🧹 Limpiar TODO'}
        </button>

        <button
          onClick={exportData}
          disabled={loading}
          style={{
            padding: '12px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            opacity: loading ? 0.6 : 1
          }}
        >
          📥 Exportar Backup
        </button>
      </div>

      <div style={{
        fontSize: '12px',
        color: '#6c757d',
        lineHeight: '1.4'
      }}>
        <p><strong>🚀 Inicializar:</strong> Configura el sistema sin tarjetas predeterminadas</p>
        <p><strong>🗑️ Eliminar Tarjetas:</strong> Borra todas las tarjetas (mantiene configuraciones)</p>
        <p><strong>🧹 Limpiar TODO:</strong> Elimina absolutamente todo y reinicia la app</p>
        <p><strong>📥 Exportar:</strong> Descarga un backup antes de limpiar</p>
      </div>
    </div>
  );
};

export default DataInitializer;