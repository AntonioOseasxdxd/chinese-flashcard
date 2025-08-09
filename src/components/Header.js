// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/" className="logo">
          <h1>中文卡片</h1>
          <span>Chinese Cards</span>
        </Link>
        
        <nav className="main-nav">
          <Link to="/" className="nav-link">Inicio</Link>
          <Link to="/practice" className="nav-link">Practicar</Link>
          <Link to="/progress" className="nav-link">Progreso</Link>
          <Link to="/settings" className="nav-link">Configuración</Link>
        </nav>
        
        <div className="header-actions">
          <div className="streak-counter">
            🔥 7 días
          </div>
          <button className="profile-btn">👤</button>
        </div>
      </div>
    </header>
  );
};

export default Header;