// src/BottomNav.js
import React from 'react';

function BottomNav({ currentPage, setCurrentPage }) {
  const styles = {
    navContainer: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '60px',
      backgroundColor: 'white',
      display: 'flex',
      justifyContent: 'space-around',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
      zIndex: 100
    },
    navItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      cursor: 'pointer',
      color: '#6c757d',
      transition: 'color 0.2s'
    },
    activeNavItem: {
      color: '#20B2AA' // Active color
    },
    navIcon: {
      fontSize: '24px'
    },
    navText: {
      fontSize: '12px'
    }
  };

  const navItems = [
    { page: 'home', icon: '🏠', label: 'Home' },
    { page: 'scan', icon: '📸', label: 'Scan' },
    { page: 'map', icon: '🗺️', label: 'Map' },
    { page: 'verify', icon: '🛡️', label: 'Verify' }
  ];

  return (
    <div style={styles.navContainer}>
      {navItems.map(item => (
        <div 
          key={item.page} 
          style={currentPage === item.page ? {...styles.navItem, ...styles.activeNavItem} : styles.navItem}
          onClick={() => setCurrentPage(item.page)}
        >
          <span style={styles.navIcon}>{item.icon}</span>
          <span style={styles.navText}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default BottomNav;
