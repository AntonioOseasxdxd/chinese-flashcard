// src/components/Navigation.jsx
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: '🏠', label: 'Inicio' },
    { path: '/practice', icon: '📚', label: 'Practicar' },
    { path: '/progress', icon: '📊', label: 'Progreso' },
    { path: '/cards', icon: '📝', label: 'Tarjetas' }, // NUEVO
    { path: '/settings', icon: '⚙️', label: 'Config' }
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderTop: '1px solid #e0e0e0',
      padding: '8px 0',
      zIndex: 1000
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px',
              borderRadius: '8px',
              textDecoration: 'none',
              backgroundColor: location.pathname === item.path ? '#e3f2fd' : 'transparent',
              color: location.pathname === item.path ? '#1976d2' : '#666',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '20px', marginBottom: '2px' }}>
              {item.icon}
            </span>
            <span style={{ fontSize: '10px', fontWeight: '500' }}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;