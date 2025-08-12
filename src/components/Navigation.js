// src/components/Navigation.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    {
      path: '/',
      icon: '🏠',
      label: 'Inicio',
      exact: true
    },
    {
      path: '/practice',
      icon: '🎯',
      label: 'Práctica'
    },
    {
      path: '/cards',
      icon: '📝',
      label: 'Cartas'
    },
    {
      path: '/settings',
      icon: '⚙️',
      label: 'Config'
    }
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderTop: '1px solid #dee2e6',
      padding: '8px 0',
      zIndex: 100,
      boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${navItems.length}, 1fr)`,
        maxWidth: '600px',
        margin: '0 auto',
        gap: '4px'
      }}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px 4px',
              textDecoration: 'none',
              color: isActive(item.path, item.exact) ? '#007bff' : '#6c757d',
              backgroundColor: isActive(item.path, item.exact) ? '#f0f8ff' : 'transparent',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              fontSize: '10px',
              fontWeight: isActive(item.path, item.exact) ? '600' : '400'
            }}
          >
            <div style={{ 
              fontSize: '18px', 
              marginBottom: '2px',
              transform: isActive(item.path, item.exact) ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s ease'
            }}>
              {item.icon}
            </div>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;