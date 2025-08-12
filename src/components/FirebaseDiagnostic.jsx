// src/components/FirebaseDiagnostic.jsx
import React, { useState, useEffect } from 'react';
import { FirebaseSync } from '../services/firebaseSync';
import { OfflineStorage } from '../services/offlineStorage';
import { checkFirestoreConnection } from '../services/firebase';

const FirebaseDiagnostic = () => {
  const [status, setStatus] = useState({
    firebase: 'checking',
    sync: 'idle',
    local: 'checking',
    user: null
  });
  
  const [data, setData] = useState({
    firebaseDecks: 0,
    firebaseCards: 0,
    firebaseProgress: 0,
    localDecks: 0,
    localCards: 0,
    localProgress: 0
  });
  
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), { message, type, timestamp }]);
  };

  // Verificar estado inicial
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    addLog('🔍 Iniciando diagnóstico...', 'info');
    
    try {
      // Verificar conexión a Firebase
      const firebaseOnline = await checkFirestoreConnection();
      setStatus(prev => ({ ...prev, firebase: firebaseOnline ? 'online' : 'offline' }));
      addLog(`🔥 Firebase: ${firebaseOnline ? 'Online' : 'Offline'}`, firebaseOnline ? 'success' : 'warning');

      // Inicializar Firebase Sync
      await FirebaseSync.initializeUser();
      setStatus(prev => ({ ...prev, user: FirebaseSync.currentUser }));
      addLog(`👤 Usuario: ${FirebaseSync.currentUser}`, 'info');

      // Verificar datos locales
      const localDecks = await OfflineStorage.getDecks();
      const localCards = await OfflineStorage.getCards();
      const localProgress = await OfflineStorage.getProgress();
      
      addLog(`💾 Local - Mazos: ${localDecks.length}, Cartas: ${localCards.length}, Progreso: ${Object.keys(localProgress).length}`, 'info');
      
      setData(prev => ({
        ...prev,
        localDecks: localDecks.length,
        localCards: localCards.length,
        localProgress: Object.keys(localProgress).length
      }));

      if (firebaseOnline) {
        // Verificar datos en Firebase
        try {
          const firebaseDecks = await FirebaseSync.getDecks();
          const firebaseCards = await FirebaseSync.getCards();
          const firebaseProgress = await FirebaseSync.getProgress();
          
          addLog(`☁️ Firebase - Mazos: ${firebaseDecks.length}, Cartas: ${firebaseCards.length}, Progreso: ${Object.keys(firebaseProgress).length}`, 'success');
          
          setData(prev => ({
            ...prev,
            firebaseDecks: firebaseDecks.length,
            firebaseCards: firebaseCards.length,
            firebaseProgress: Object.keys(firebaseProgress).length
          }));
        } catch (error) {
          addLog(`❌ Error accediendo a Firebase: ${error.message}`, 'error');
        }
      }

      setStatus(prev => ({ ...prev, local: 'ready' }));
      addLog('✅ Diagnóstico completado', 'success');

    } catch (error) {
      addLog(`❌ Error en diagnóstico: ${error.message}`, 'error');
    }
  };

  const forceSync = async () => {
    setStatus(prev => ({ ...prev, sync: 'syncing' }));
    addLog('🔄 Iniciando sincronización forzada...', 'info');
    
    try {
      const result = await FirebaseSync.forceSync();
      
      if (result.success) {
        addLog(`✅ Sincronización exitosa - Mazos: ${result.decks.length}, Cartas: ${result.cards.length}`, 'success');
        setData(prev => ({
          ...prev,
          firebaseDecks: result.decks.length,
          firebaseCards: result.cards.length,
          firebaseProgress: Object.keys(result.progress).length
        }));
      } else {
        addLog(`⚠️ Sincronización falló: ${result.error}`, 'warning');
      }
    } catch (error) {
      addLog(`❌ Error en sincronización: ${error.message}`, 'error');
    }
    
    setStatus(prev => ({ ...prev, sync: 'idle' }));
  };

  const clearFirebaseData = async () => {
    if (!window.confirm('¿Estás seguro de que quieres limpiar todos los datos de Firebase? Esta acción no se puede deshacer.')) {
      return;
    }
    
    addLog('🗑️ Limpiando datos de Firebase...', 'warning');
    
    try {
      const success = await FirebaseSync.clearUserData();
      if (success) {
        addLog('✅ Datos de Firebase limpiados', 'success');
        setData(prev => ({
          ...prev,
          firebaseDecks: 0,
          firebaseCards: 0,
          firebaseProgress: 0
        }));
      } else {
        addLog('❌ Error al limpiar datos de Firebase', 'error');
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
    }
  };

  const clearLocalData = async () => {
    if (!window.confirm('¿Estás seguro de que quieres limpiar todos los datos locales? Esta acción no se puede deshacer.')) {
      return;
    }
    
    addLog('🗑️ Limpiando datos locales...', 'warning');
    
    try {
      await OfflineStorage.clearAllData();
      addLog('✅ Datos locales limpiados', 'success');
      setData(prev => ({
        ...prev,
        localDecks: 0,
        localCards: 0,
        localProgress: 0
      }));
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
    }
  };

  const getStatusColor = (statusType) => {
    switch (statusType) {
      case 'online':
      case 'ready':
      case 'success':
        return '#10b981';
      case 'offline':
      case 'warning':
        return '#f59e0b';
      case 'checking':
      case 'syncing':
        return '#6366f1';
      case 'error':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '80vh',
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827'
        }}>
          🔧 Diagnóstico Firebase
        </h3>
        <p style={{
          margin: '4px 0 0 0',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          Usuario: {status.user || 'No inicializado'}
        </p>
      </div>

      {/* Estado */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '8px',
            borderRadius: '4px',
            backgroundColor: '#f3f4f6'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '4px'
            }}>Firebase</div>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: getStatusColor(status.firebase)
            }}>
              {status.firebase === 'online' ? '🟢 Online' : 
               status.firebase === 'offline' ? '🔴 Offline' : 
               '🟡 Checking'}
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '8px',
            borderRadius: '4px',
            backgroundColor: '#f3f4f6'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '4px'
            }}>Local</div>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: getStatusColor(status.local)
            }}>
              {status.local === 'ready' ? '🟢 Ready' : 
               status.local === 'checking' ? '🟡 Checking' : 
               '🔴 Error'}
            </div>
          </div>
        </div>

        {/* Datos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <div style={{ textAlign: 'center', fontSize: '12px' }}>
            <div style={{ color: '#6b7280' }}>Mazos</div>
            <div style={{ fontWeight: '600' }}>☁️ {data.firebaseDecks}</div>
            <div style={{ fontWeight: '600' }}>💾 {data.localDecks}</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '12px' }}>
            <div style={{ color: '#6b7280' }}>Cartas</div>
            <div style={{ fontWeight: '600' }}>☁️ {data.firebaseCards}</div>
            <div style={{ fontWeight: '600' }}>💾 {data.localCards}</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '12px' }}>
            <div style={{ color: '#6b7280' }}>Progreso</div>
            <div style={{ fontWeight: '600' }}>☁️ {data.firebaseProgress}</div>
            <div style={{ fontWeight: '600' }}>💾 {data.localProgress}</div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px'
        }}>
          <button
            onClick={checkStatus}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔍 Revisar
          </button>
          
          <button
            onClick={forceSync}
            disabled={status.sync === 'syncing'}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              backgroundColor: status.sync === 'syncing' ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: status.sync === 'syncing' ? 'not-allowed' : 'pointer'
            }}
          >
            {status.sync === 'syncing' ? '⏳ Sync...' : '🔄 Sincronizar'}
          </button>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginTop: '8px'
        }}>
          <button
            onClick={clearLocalData}
            style={{
              padding: '6px 8px',
              fontSize: '11px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🗑️ Local
          </button>
          
          <button
            onClick={clearFirebaseData}
            style={{
              padding: '6px 8px',
              fontSize: '11px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🗑️ Firebase
          </button>
        </div>
      </div>

      {/* Logs */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '8px'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '8px',
          fontWeight: '600'
        }}>
          📜 Logs:
        </div>
        
        <div style={{
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {logs.map((log, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '4px',
                fontSize: '11px',
                lineHeight: '1.4'
              }}
            >
              <span style={{
                color: '#9ca3af',
                fontSize: '10px',
                minWidth: '50px'
              }}>
                {log.timestamp}
              </span>
              <span style={{
                color: getLogColor(log.type),
                flex: 1
              }}>
                {log.message}
              </span>
            </div>
          ))}
          
          {logs.length === 0 && (
            <div style={{
              textAlign: 'center',
              color: '#9ca3af',
              fontStyle: 'italic',
              fontSize: '11px'
            }}>
              No hay logs disponibles
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FirebaseDiagnostic;