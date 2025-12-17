import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';

function MedicineScanner({ db, contractAddress, contractAbi, pinataJWT, ethers, sha256 }) {
  const [scanFile, setScanFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showComplaintForm, setShowComplaintForm] = useState(false);

  const [pharmacyName, setPharmacyName] = useState('');
  const [location, setLocation] = useState('');
  const [reason, setReason] = useState('Counterfeit packaging detected');
  const [description, setDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const handleScanFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setScanResult(null);
      setShowComplaintForm(false);
      setScanFile(file);
    }
  };

  const handleScan = async () => {
    if (!scanFile) return;
    setIsScanning(true);
    setScanResult(null);

    try {
      const formData = new FormData();
      formData.append('file', scanFile);

      const response = await axios.post('http://localhost:5000/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const pred = response.data.prediction;

      if (pred.toLowerCase() === 'counterfeit') {
        setScanResult({
          status: 'Counterfeit',
          message: 'Model detected that this medicine is counterfeit.',
          color: '#E53E3E',
        });
      } else {
        setScanResult({
          status: 'Valid',
          message: 'Model detected that this medicine is authentic.',
          color: '#38A169',
        });
      }
    } catch (error) {
      setScanResult({
        status: 'Error',
        message: 'Failed to analyze image. Please try again.',
        color: '#E53E3E',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!pharmacyName || !location || !reason || !description || !evidenceFile) {
      setSubmitStatus('Error: All fields and an evidence file are required.');
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus('Submitting report...');

    try {
      setSubmitStatus('Step 1/3: Uploading evidence to IPFS...');
      const formData = new FormData();
      formData.append('file', evidenceFile);
      const pinataResponse = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: { 'Authorization': `Bearer ${pinataJWT}` }
      });
      const ipfsCid = pinataResponse.data.IpfsHash;

      setSubmitStatus('Step 2/3: Storing evidence hash on blockchain...');
      if (!window.ethereum) throw new Error("MetaMask is not installed.");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractAbi, signer);

      const reportTimestamp = Date.now().toString();
      const combinedString = `${pharmacyName}-${location}-${reason}-${description}-${ipfsCid}-${reportTimestamp}`;
      const reportId = ethers.keccak256(ethers.toUtf8Bytes(combinedString));
      const evidenceHashAndCid = `${sha256(combinedString)}_${ipfsCid}`;

      const tx = await contract.storeEvidenceHash(reportId, evidenceHashAndCid);
      await tx.wait();

      setSubmitStatus('Step 3/3: Saving report details...');
      await addDoc(collection(db, 'complaints'), {
        pharmacyName, location, reason, description, ipfsCid,
        blockchainTxHash: tx.hash,
        reportTimestamp,
        createdAt: serverTimestamp(),
        status: 'Pending Review'
      });

      setSubmitStatus(`✅ Report submitted successfully!`);
      setTimeout(() => setShowComplaintForm(false), 2000);

    } catch (err) {
      setSubmitStatus(`Error: ${err.message || 'An unknown error occurred.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = {
    formContainer: { marginTop: '20px', padding: '0', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#F5F5F5', overflow: 'hidden' },
    topBar: { backgroundColor: '#20B2AA', padding: '12px 20px', color: 'black', fontSize: '18px', fontWeight: 'bold', textAlign: 'center' },
    formContent: { padding: '20px' },
    inputGroup: { marginBottom: '24px' },
    labelContainer: { display: 'flex', alignItems: 'center', marginBottom: '8px' },
    labelIcon: { width: '20px', height: '20px', marginRight: '12px' },
    labelText: { fontWeight: 'bold', fontSize: '16px', color: 'black' },
    input: { width: '100%', height: '50px', padding: '0 16px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
    textarea: { width: '100%', minHeight: '120px', padding: '16px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', fontFamily: 'sans-serif' },
    submitButton: { width: '100%', height: '50px', backgroundColor: '#68B648', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    infoText: { textAlign: 'center', color: '#999999', fontSize: '12px', marginTop: '16px' }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '20px' }}>
      <h2>Scan Medicine Package</h2>
      <input type="file" accept="image/*" onChange={handleScanFileChange} disabled={isScanning} />
      <button onClick={handleScan} disabled={isScanning || !scanFile} style={{ marginLeft: '10px' }}>
        {isScanning ? 'Scanning...' : 'Scan Image'}
      </button>

      {scanFile && !isScanning && (
        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <img src={URL.createObjectURL(scanFile)} alt="Selected for scan" style={{ maxWidth: '400px', border: '1px solid #ccc' }} />
        </div>
      )}

      {scanResult && (
        <div style={{ marginTop: '20px', padding: '20px', border: `3px solid ${scanResult.color}`, backgroundColor: `${scanResult.color}20`, borderRadius: '8px' }}>
          <h3 style={{ margin: 0, color: scanResult.color }}>STATUS: {scanResult.status.toUpperCase()}</h3>
          <p>{scanResult.message}</p>
          {scanResult.status === 'Counterfeit' && !showComplaintForm && (
            <button onClick={() => setShowComplaintForm(true)} style={{ marginTop: '10px', backgroundColor: '#E53E3E', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}>
              File Complaint
            </button>
          )}
        </div>
      )}

      {showComplaintForm && (
        <div style={styles.formContainer}>
          <div style={styles.topBar}>Report Seller / Pharmacy</div>
          <div style={styles.formContent}>
            <form onSubmit={handleComplaintSubmit}>
              <div style={styles.inputGroup}>
                <div style={styles.labelContainer}>
                  <span style={styles.labelIcon}>&#127973;</span>
                  <span style={styles.labelText}>Pharmacy Name</span>
                </div>
                <input style={styles.input} type="text" value={pharmacyName} onChange={e => setPharmacyName(e.target.value)} placeholder="Pharmacy Name" required />
              </div>

              <div style={styles.inputGroup}>
                <div style={styles.labelContainer}>
                  <span style={styles.labelIcon}>&#128205;</span>
                  <span style={styles.labelText}>Location</span>
                </div>
                <input style={styles.input} type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" required />
              </div>

              <div style={styles.inputGroup}>
                <div style={styles.labelContainer}>
                  <span style={styles.labelIcon}>&#10067;</span>
                  <span style={styles.labelText}>Reason</span>
                </div>
                <input style={styles.input} type="text" value={reason} onChange={e => setReason(e.target.value)} required />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.labelText}>Description</label>
                <textarea style={styles.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" required />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.labelText}>Upload Evidence Image</label>
                <input style={{ ...styles.input, padding: '8px', height: 'auto' }} type="file" accept="image/*" onChange={e => setEvidenceFile(e.target.files[0])} required />
              </div>

              <button type="submit" style={styles.submitButton} disabled={isSubmitting}>
                <span style={{ marginRight: '12px' }}>&#10003;</span>
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
              {submitStatus && <p style={{ marginTop: '15px', textAlign: 'center' }}>{submitStatus}</p>}
              <div style={styles.infoText}>Data will be verified and logged securely.</div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicineScanner;
