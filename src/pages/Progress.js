// src/pages/Progress.js
import React from 'react';

const Progress = ({ cards = [], userProgress = {} }) => {
  return (
    <div className="progress-container">
      <h1>Tu Progreso</h1>
      
      <div className="progress-stats">
        <div className="stat-large">
          <h2>7</h2>
          <p>Días de Racha</p>
        </div>
        
        <div className="progress-grid">
          <div className="progress-item">
            <h3>Cartas Dominadas</h3>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: '65%'}}></div>
            </div>
            <p>13 de 20</p>
          </div>
          
          <div className="progress-item">
            <h3>Tiempo Total</h3>
            <p>2h 30m</p>
          </div>
          
          <div className="progress-item">
            <h3>Precisión</h3>
            <p>87%</p>
          </div>
        </div>
      </div>

      <div className="categories-progress">
        <h2>Progreso por Categoría</h2>
        <div className="category-progress-list">
          <div className="category-progress-item">
            <span>Saludos</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: '100%'}}></div>
            </div>
            <span>10/10</span>
          </div>
          
          <div className="category-progress-item">
            <span>Números</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: '40%'}}></div>
            </div>
            <span>8/20</span>
          </div>
          
          <div className="category-progress-item">
            <span>Familia</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: '20%'}}></div>
            </div>
            <span>3/15</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;