// src/ScanPage.js
import React, { useState, useRef, useEffect } from 'react';
import CameraCapture from './CameraCapture'; // keep using your existing camera component

function ScanPage({ onFileComplaint }) {
  const [scanFile, setScanFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef(null);

  // Revoke object URL to avoid memory leak
  useEffect(() => {
    return () => {
      if (scanFile && typeof scanFile !== 'string') {
        try {
          URL.revokeObjectURL(scanFile.preview);
        } catch (e) {}
      }
    };
  }, [scanFile]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // attach preview url so we can revoke later
      file.preview = URL.createObjectURL(file);
      setScanResult(null);
      setScanFile(file);
      handleScan(file);
    }
  };

  const handlePhotoTaken = (file) => {
    // CameraCapture should return a File object
    setShowCamera(false);
    if (!file) return;
    file.preview = URL.createObjectURL(file);
    setScanResult(null);
    setScanFile(file);
    handleScan(file);
  };

  const handleScan = async (file) => {
    if (!file) return;

    setIsScanning(true);
    setScanResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use 127.0.0.1 to match Flask logs reliably
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        body: formData,
      });

      console.log('RESPONSE STATUS:', response.status);
      const text = await response.clone().text();
      console.log('RESPONSE TEXT:', text);

      // Try to parse JSON
      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error('Failed to parse JSON from backend:', parseErr);
        setScanResult({
          status: 'Error',
          message: 'Invalid response from verification server.',
          color: '#D69E2E'
        });
        setIsScanning(false);
        return;
      }

      console.log('MODEL RESULT:', data);

      if (data.error) {
        // backend returned error object
        setScanResult({
          status: 'Error',
          message: data.error + (data.details ? ` — ${data.details}` : ''),
          color: '#D69E2E'
        });
      } else if (data.prediction) {
        const pred = String(data.prediction).toLowerCase();
        if (pred === 'counterfeit' || pred === 'fake') {
          setScanResult({
            status: 'Counterfeit',
            message: 'The AI model detected this medicine as counterfeit.',
            color: '#E53E3E'
          });
        } else {
          setScanResult({
            status: 'Valid',
            message: 'This medicine appears authentic.',
            color: '#38A169'
          });
        }
      } else {
        setScanResult({
          status: 'Error',
          message: 'Unexpected response from server.',
          color: '#D69E2E'
        });
      }
    } catch (err) {
      console.error('Scan error:', err);
      setScanResult({
        status: 'Error',
        message: 'Failed to verify. Please check your network and try again.',
        color: '#D69E2E'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const styles = {
    pageContainer: { maxWidth: '600px', margin: 'auto', backgroundColor: '#f4f4f9', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
    previewArea: { width: '100%', height: '250px', backgroundColor: '#e9ecef', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px', border: '2px dashed #ced4da', overflow: 'hidden' },
    imagePreview: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
    placeholderText: { color: '#6c757d', textAlign: 'center' },
    buttonContainer: { display: 'flex', justifyContent: 'space-around', marginBottom: '20px' },
    actionButton: { display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#ffffff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '15px 20px', cursor: 'pointer', flex: 1, margin: '0 10px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    buttonIcon: { fontSize: '24px', marginBottom: '8px' },
    resultContainer: { textAlign: 'center', padding: '20px', borderRadius: '8px', borderWidth: '3px', borderStyle: 'solid' }
  };

  return (
    <div style={styles.pageContainer}>
      {showCamera && <CameraCapture onCapture={handlePhotoTaken} onCancel={() => setShowCamera(false)} />}

      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Scan Medicine</h2>

      <div style={styles.previewArea}>
        {scanFile ? (
          <img src={scanFile.preview || URL.createObjectURL(scanFile)} alt="Preview" style={styles.imagePreview} />
        ) : (
          <div style={styles.placeholderText}>
            <span style={{fontSize: '40px'}}>📷</span>
            <p>Image preview will appear here</p>
          </div>
        )}
      </div>

      <div style={styles.buttonContainer}>
        <div style={styles.actionButton} onClick={() => setShowCamera(true)}>
          <span style={styles.buttonIcon} role="img" aria-label="camera">📸</span>
          <span>Open Camera</span>
        </div>

        <div style={styles.actionButton} onClick={() => fileInputRef.current.click()}>
          <span style={styles.buttonIcon} role="img" aria-label="gallery">🖼️</span>
          <span>Upload from Gallery</span>
        </div>
      </div>

      {isScanning && <div style={{textAlign: 'center', padding: '10px', color: '#6c757d'}}>Processing...</div>}

      {scanResult && (
        <div style={{...styles.resultContainer, borderColor: scanResult.color, backgroundColor: `${scanResult.color}20`}}>
          <h3 style={{ color: scanResult.color, marginTop: 0 }}>STATUS: {scanResult.status.toUpperCase()}</h3>
          <p>{scanResult.message}</p>
          {scanResult.status === 'Counterfeit' && (
            <button onClick={() => onFileComplaint(scanFile)} style={{ marginTop: '10px', backgroundColor: '#E53E3E', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
              File Complaint
            </button>
          )}
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
    </div>
  );
}

export default ScanPage;
