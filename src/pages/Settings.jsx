// src/pages/Settings.js
import { useState } from 'react';


const Settings = ({ settings = {}, updateSettings = () => {} }) => {
  const [localSettings, setLocalSettings] = useState({
    soundEnabled: true,
    dailyGoal: 20,
    difficulty: 'medium',
    showPinyin: true,
    autoPlay: false,
    ...settings
  });

  const handleSettingChange = (key, value) => {
    const newSettings = {
      ...localSettings,
      [key]: value
    };
    setLocalSettings(newSettings);
    updateSettings(newSettings);
  };

  return (
    <div className="settings-container">
      <h1>Configuración</h1>
      
      <div className="settings-section">
        <h2>Audio</h2>
        <div className="setting-item">
          <label>
            <input 
              type="checkbox" 
              checked={settings.soundEnabled}
              onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
            />
            Sonido activado
          </label>
        </div>
        
        <div className="setting-item">
          <label>
            <input 
              type="checkbox" 
              checked={settings.autoPlay}
              onChange={(e) => handleSettingChange('autoPlay', e.target.checked)}
            />
            Reproducir audio automáticamente
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h2>Estudio</h2>
        <div className="setting-item">
          <label>
            Meta diaria de cartas:
            <input 
              type="number" 
              value={settings.dailyGoal}
              onChange={(e) => handleSettingChange('dailyGoal', parseInt(e.target.value))}
              min="5"
              max="100"
            />
          </label>
        </div>
        
        <div className="setting-item">
          <label>
            <input 
              type="checkbox" 
              checked={settings.showPinyin}
              onChange={(e) => handleSettingChange('showPinyin', e.target.checked)}
            />
            Mostrar pinyin
          </label>
        </div>
        
        <div className="setting-item">
          <label>
            Dificultad predeterminada:
            <select 
              value={settings.difficulty}
              onChange={(e) => handleSettingChange('difficulty', e.target.value)}
            >
              <option value="easy">Fácil</option>
              <option value="medium">Medio</option>
              <option value="hard">Difícil</option>
            </select>
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h2>Datos</h2>
        <button className="btn-secondary">Exportar Progreso</button>
        <button className="btn-secondary">Importar Progreso</button>
        <button className="btn-danger">Resetear Todo</button>
      </div>
    </div>
  );
};

export default Settings;