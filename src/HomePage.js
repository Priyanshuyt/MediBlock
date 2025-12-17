// src/HomePage.js
import React from 'react';

// The component receives a function to handle navigation
function HomePage({ navigate }) {
  const styles = {
    pageContainer: {
      textAlign: 'center',
      padding: '20px',
      backgroundColor: '#f4f4f9',
      minHeight: '80vh'
    },
    header: {
      marginBottom: '40px'
    },
    title: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#20B2AA'
    },
    subtitle: {
      fontSize: '16px',
      color: '#6c757d'
    },
    buttonGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '20px',
      maxWidth: '400px',
      margin: 'auto'
    },
    navButton: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: 'white',
      border: '1px solid #dee2e6',
      borderRadius: '12px',
      cursor: 'pointer',
      boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
      transition: 'transform 0.2s',
    },
    buttonIcon: {
      fontSize: '40px',
      marginBottom: '10px'
    },
    buttonText: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#333'
    }
  };

  // Function to handle hover effect
  const handleMouseOver = (e) => e.currentTarget.style.transform = 'scale(1.05)';
  const handleMouseOut = (e) => e.currentTarget.style.transform = 'scale(1)';

  return (
    <div style={styles.pageContainer}>
      <div style={styles.header}>
        {/* --- NAME CHANGED HERE --- */}
        <h1 style={styles.title}>MediBlock</h1>
        <p style={styles.subtitle}>Your trusted partner in ensuring medicine safety.</p>
      </div>

      <div style={styles.buttonGrid}>
        <div style={styles.navButton} onClick={() => navigate('scan')} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
          <span style={styles.buttonIcon} role="img" aria-label="scan">📸</span>
          <span style={styles.buttonText}>Scan Medicine</span>
        </div>
        <div style={styles.navButton} onClick={() => navigate('map')} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
          <span style={styles.buttonIcon} role="img" aria-label="map">🗺️</span>
          <span style={styles.buttonText}>Nearby Pharmacies</span>
        </div>
        <div style={styles.navButton} onClick={() => navigate('verify')} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
          <span style={styles.buttonIcon} role="img" aria-label="verify">🛡️</span>
          <span style={styles.buttonText}>Verify Evidence</span>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
