// src/ScannerPage.js
import React, { useState } from 'react';
import axios from 'axios';

const ScannerPage = ({ onNavigateToReport }) => {
  // --- UI STATE ---
  const [capturedImage, setCapturedImage] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /**
   * Handle File Input
   * Captures the image, creates a local preview, and resets previous results.
   */
  const handleCapture = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setCapturedImage(file);
      setPreviewSrc(URL.createObjectURL(file));
      setScanResult(null); // Clear old results when a new photo is taken
    }
  };

  /**
   * Run Verification
   * Sends the image to the Python backend for ML analysis.
   */
  const performScan = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    
    // Create payload
    const formData = new FormData();
    formData.append('image', capturedImage);
    // Simulating a batch ID for the demo
    formData.append('batch_id', `BATCH_${Math.floor(Math.random() * 10000)}`);

    try {
      // API Call to Python Backend
      const { data } = await axios.post('http://127.0.0.1:5000/verify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setScanResult(data);
    } catch (err) {
      console.error("Verification Engine Error:", err);
      alert("⚠️ Error connecting to the verification engine. Please ensure the backend server is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Helper to determine badge color based on result
   */
  const getBadgeStyle = (status) => {
    const isPass = status === "PASS";
    return {
      ...styles.badge,
      backgroundColor: isPass ? '#e8f5e9' : '#ffebee',
      color: isPass ? '#2e7d32' : '#c62828',
      border: `1px solid ${isPass ? '#a5d6a7' : '#ef9a9a'}`
    };
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>💊 MediBlock Scanner</h1>
        <p style={styles.subtitle}>Instant authenticity verification</p>
      </div>
      
      {/* Capture Area */}
      <div style={styles.card}>
        <div style={styles.uploadZone}>
          {previewSrc ? (
            <img src={previewSrc} alt="Captured Tablet" style={styles.previewImage} />
          ) : (
            <div style={styles.placeholder}>
              <span style={{fontSize: '40px'}}>📸</span>
              <p>Tap to Capture Image</p>
            </div>
          )}
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" // Forces rear camera on mobile
            onChange={handleCapture}
            style={styles.hiddenInput}
            id="cameraInput"
          />
          <label htmlFor="cameraInput" style={styles.uploadLabel}>
            {previewSrc ? "Retake Photo" : "Open Camera"}
          </label>
        </div>

        {/* Scan Action */}
        <button 
          onClick={performScan} 
          disabled={!capturedImage || isAnalyzing}
          style={{
            ...styles.actionBtn,
            opacity: (!capturedImage || isAnalyzing) ? 0.6 : 1,
            cursor: (!capturedImage || isAnalyzing) ? 'not-allowed' : 'pointer'
          }}
        >
          {isAnalyzing ? "Processing..." : "🔍 Verify Authenticity"}
        </button>
      </div>

      {/* Results Display */}
      {scanResult && (
        <div style={styles.resultContainer}>
          <h3 style={styles.resultTitle}>Analysis Report</h3>
          
          <div style={getBadgeStyle(scanResult.verification_result)}>
            {scanResult.verification_result === "PASS" ? (
              <span>✅ <strong>GENUINE</strong> (Confidence: {scanResult.confidence})</span>
            ) : (
              <span>⚠️ <strong>POTENTIAL FAKE</strong> (Confidence: {scanResult.confidence})</span>
            )}
          </div>

          <div style={styles.metaData}>
            <strong>Batch ID:</strong> {scanResult.batch_id}
          </div>

          {/* Report Button (Only shows if Fake) */}
          {scanResult.verification_result !== "PASS" && (
            <button 
              style={styles.dangerBtn}
              onClick={() => onNavigateToReport(capturedImage, { 
                name: "Unknown Distributor", 
                address: "Geolocation Tagged" 
              })}
            >
              🚨 Report Violation
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Styles extracted for cleanliness
const styles = {
  container: {
    padding: '20px',
    maxWidth: '500px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#333'
  },
  header: {
    textAlign: 'center',
    marginBottom: '25px'
  },
  title: {
    margin: '0 0 5px 0',
    color: '#2c3e50',
    fontSize: '24px'
  },
  subtitle: {
    margin: 0,
    color: '#7f8c8d',
    fontSize: '14px'
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '16px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
  },
  uploadZone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px'
  },
  placeholder: {
    width: '100%',
    height: '200px',
    backgroundColor: '#f8f9fa',
    border: '2px dashed #dee2e6',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#adb5bd',
    marginBottom: '15px'
  },
  previewImage: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'contain',
    borderRadius: '12px',
    marginBottom: '15px',
    border: '1px solid #eee'
  },
  hiddenInput: {
    display: 'none'
  },
  uploadLabel: {
    padding: '8px 16px',
    backgroundColor: '#e9ecef',
    color: '#495057',
    borderRadius: '20px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  actionBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background 0.2s'
  },
  resultContainer: {
    marginTop: '25px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '16px',
    border: '1px solid #eee',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  resultTitle: {
    marginTop: 0,
    marginBottom: '15px',
    fontSize: '18px',
    textAlign: 'center'
  },
  badge: {
    padding: '12px',
    borderRadius: '8px',
    textAlign: 'center',
    marginBottom: '15px',
    fontSize: '15px'
  },
  metaData: {
    fontSize: '13px',
    color: '#666',
    textAlign: 'center',
    marginBottom: '20px'
  },
  dangerBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#ff5252',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};

export default ScannerPage;
