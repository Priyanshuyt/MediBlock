// src/ReportPage.js
import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ReportPage = ({ 
  evidenceFile, 
  selectedPharmacy, 
  onReportSubmitted, 
  db, 
  contractAddress, 
  contractAbi, 
  pinataJWT, 
  ethers, 
  sha256, 
  axios 
}) => {
  // Form State
  const [pharmacyName, setPharmacyName] = useState('');
  const [location, setLocation] = useState('');
  const [reason, setReason] = useState('Counterfeit packaging detected');
  const [description, setDescription] = useState('');
  const [extraFiles, setExtraFiles] = useState(null);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Auto-fill form if a pharmacy was selected from the map/list
  useEffect(() => {
    if (selectedPharmacy) {
      setPharmacyName(selectedPharmacy.name || '');
      setLocation(selectedPharmacy.address || '');
    }
  }, [selectedPharmacy]);

  const uploadToIPFS = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      headers: { 
        'Authorization': `Bearer ${pinataJWT}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data.IpfsHash;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Basic Validation
    if (!pharmacyName || !location || !description || !evidenceFile) {
      setStatusMsg('⚠️ Please fill in all required fields and ensure an image is captured.');
      return;
    }

    if (!window.ethereum) {
      setStatusMsg('⚠️ MetaMask is not installed. Cannot sign transaction.');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: IPFS Upload
      setStatusMsg('☁️ Uploading evidence to decentralized storage...');
      const ipfsCid = await uploadToIPFS(evidenceFile);

      // Step 2: Blockchain Interaction
      setStatusMsg('🔗 Anchoring evidence hash on-chain...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractAbi, signer);

      // Create a unique hash for the report
      const timestamp = Date.now().toString();
      const rawData = `${pharmacyName}-${location}-${reason}-${description}-${ipfsCid}-${timestamp}`;
      
      // Generate IDs for the smart contract
      const reportId = ethers.keccak256(ethers.toUtf8Bytes(rawData));
      const integrityHash = `${sha256(rawData)}_${ipfsCid}`;

      // Send Transaction
      const tx = await contract.storeEvidenceHash(reportId, integrityHash);
      await tx.wait(); // Wait for block confirmation

      // Step 3: Firebase Logging (Off-chain data)
      setStatusMsg('📝 Saving final report details...');
      await addDoc(collection(db, 'complaints'), {
        pharmacyName,
        location,
        reason,
        description,
        ipfsCid,
        txHash: tx.hash,
        timestamp,
        createdAt: serverTimestamp(),
        status: 'Pending Review',
        attachmentCount: extraFiles ? extraFiles.length : 0
      });

      setStatusMsg('✅ Report Verified & Submitted!');
      
      // Small delay so user sees the success message before closing
      setTimeout(() => {
        onReportSubmitted();
      }, 2000);

    } catch (error) {
      console.error("Reporting Error:", error);
      setStatusMsg(`❌ Error: ${error.reason || error.message || "Transaction failed"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onReportSubmitted}>&larr;</button>
        <h2 style={styles.headerTitle}>Report Suspicious Seller</h2>
      </div>

      <div style={styles.content}>
        <form onSubmit={handleSubmit}>
          
          {/* Pharmacy Name */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              <span style={styles.icon}>🏥</span> Pharmacy / Shop Name
            </label>
            <input 
              style={styles.input} 
              type="text" 
              value={pharmacyName} 
              onChange={e => setPharmacyName(e.target.value)} 
              placeholder="e.g. City Meds Store" 
            />
          </div>

          {/* Location */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              <span style={styles.icon}>📍</span> Location / Address
            </label>
            <input 
              style={styles.input} 
              type="text" 
              value={location} 
              onChange={e => setLocation(e.target.value)} 
              placeholder="e.g. 123 Main St, New York" 
            />
          </div>

          {/* Reason Dropdown */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              <span style={styles.icon}>⚠️</span> Violation Type
            </label>
            <select 
              style={styles.select} 
              value={reason} 
              onChange={e => setReason(e.target.value)}
            >
              <option value="Counterfeit packaging detected">Counterfeit packaging detected</option>
              <option value="Expired medicine sold">Expired medicine sold</option>
              <option value="Suspicious texture/color">Suspicious texture/color</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Description of Incident</label>
            <textarea 
              style={styles.textarea} 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Please provide specific details..." 
            />
          </div>

          {/* Image Preview */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Captured Evidence</label>
            <div style={styles.previewContainer}>
              {evidenceFile ? (
                <img 
                  src={URL.createObjectURL(evidenceFile)} 
                  alt="Evidence Preview" 
                  style={styles.previewImage} 
                />
              ) : (
                <span style={{color: 'red'}}>No image captured</span>
              )}
            </div>
          </div>

          {/* Extra Files */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Additional Photos (Optional)</label>
            <input 
              type="file" 
              multiple 
              onChange={e => setExtraFiles(e.target.files)} 
              style={styles.fileInput}
            />
          </div>

          {/* Submit Action */}
          <button 
            type="submit" 
            style={{
              ...styles.submitBtn, 
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }} 
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Submit Report'}
          </button>

          {/* Status Message Display */}
          {statusMsg && (
            <div style={{
              ...styles.statusBox,
              color: statusMsg.includes('Error') || statusMsg.includes('❌') ? '#D32F2F' : '#388E3C'
            }}>
              {statusMsg}
            </div>
          )}

          <p style={styles.disclaimer}>
            Your report is hashed and permanently stored on the Polygon blockchain.
          </p>

        </form>
      </div>
    </div>
  );
};

// Styles moved outside component for better performance and cleanliness
const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: '#008080', // Teal
    color: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    marginRight: '15px',
  },
  headerTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
  },
  content: {
    padding: '25px',
  },
  fieldGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#333',
    fontSize: '14px',
  },
  icon: {
    marginRight: '8px',
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '15px',
    boxSizing: 'border-box', // Critical for padding
  },
  select: {
    width: '100%',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '15px',
    backgroundColor: 'white',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    minHeight: '100px',
    fontSize: '14px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  previewContainer: {
    border: '2px dashed #ddd',
    padding: '10px',
    borderRadius: '6px',
    textAlign: 'center',
    backgroundColor: 'white',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '200px',
    borderRadius: '4px',
  },
  fileInput: {
    fontSize: '14px',
    color: '#666',
  },
  submitBtn: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#2e7d32', // Darker Green
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '10px',
    transition: 'background 0.3s',
  },
  statusBox: {
    marginTop: '20px',
    padding: '12px',
    borderRadius: '6px',
    textAlign: 'center',
    fontWeight: '500',
    backgroundColor: '#fff',
    border: '1px solid #eee',
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#888',
    marginTop: '15px',
  }
};

export default ReportPage;
