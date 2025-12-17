// src/CameraCapture.js
import React, { useRef, useEffect, useState } from 'react';

function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    // Function to get camera access
    const getCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStream(stream);
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access the camera. Please check permissions.");
        onCancel(); // Close the modal if camera access fails
      }
    };

    getCameraStream();

    // Cleanup function to stop the camera stream when the component is closed
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onCancel, stream]);

  const handleCapture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Convert the canvas image to a file
    canvas.toBlob((blob) => {
      const capturedFile = new File([blob], "camera_capture.png", { type: "image/png" });
      onCapture(capturedFile); // Send the captured file back to the ScanPage
    }, 'image/png');
  };

  const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 1000
    },
    container: {
      backgroundColor: 'white', padding: '20px', borderRadius: '8px',
      display: 'flex', flexDirection: 'column', alignItems: 'center'
    },
    video: { width: '100%', maxWidth: '500px', borderRadius: '4px' },
    buttonContainer: { marginTop: '15px' },
    captureButton: {
      padding: '10px 20px', fontSize: '16px', cursor: 'pointer',
      backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px'
    },
    cancelButton: {
        marginLeft: '10px', padding: '10px 20px', fontSize: '16px', cursor: 'pointer',
        backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px'
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <video ref={videoRef} autoPlay style={styles.video}></video>
        <div style={styles.buttonContainer}>
          <button onClick={handleCapture} style={styles.captureButton}>Take Picture</button>
          <button onClick={onCancel} style={styles.cancelButton}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default CameraCapture;
