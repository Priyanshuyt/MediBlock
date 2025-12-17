// src/ReportPage.js
import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// The component now accepts 'selectedPharmacy'
function ReportPage({ evidenceFile, selectedPharmacy, onReportSubmitted, db, contractAddress, contractAbi, pinataJWT, ethers, sha256, axios }) {
  const [pharmacyName, setPharmacyName] = useState('');
  const [location, setLocation] = useState('');
  const [reason, setReason] = useState('Counterfeit packaging detected');
  const [description, setDescription] = useState('');
  const [additionalFiles, setAdditionalFiles] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  // --- NEW: useEffect to pre-fill the form ---
  useEffect(() => {
    if (selectedPharmacy) {
      setPharmacyName(selectedPharmacy.name);
      setLocation(selectedPharmacy.address);
    }
  }, [selectedPharmacy]); // This runs when the component loads with a selected pharmacy

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!pharmacyName || !location || !reason || !description || !evidenceFile) {
      setSubmitStatus('Error: All fields are required.');
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus('Submitting report...');

    try {
      setSubmitStatus('Step 1/3: Uploading primary evidence to IPFS...');
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
        status: 'Pending Review',
        additionalFileCount: additionalFiles ? additionalFiles.length : 0
      });

      setSubmitStatus(`✅ Report submitted successfully! Returning to scanner...`);
      setTimeout(onReportSubmitted, 2500);

    } catch (err) {
      setSubmitStatus(`Error: ${err.message || 'An unknown error occurred.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = {
    pageContainer: { maxWidth: '600px', margin: 'auto', backgroundColor: '#F5F5F5', fontFamily: 'sans-serif' },
    topBar: { display: 'flex', alignItems: 'center', height: '56px', backgroundColor: '#20B2AA', padding: '0 16px', color: 'black' },
    backButton: { fontSize: '24px', cursor: 'pointer', padding: '12px' },
    topBarTitle: { flex: 1, marginLeft: '16px', fontSize: '18px', fontWeight: 'bold' },
    formContent: { padding: '20px' },
    inputGroup: { marginBottom: '24px' },
    labelContainer: { display: 'flex', alignItems: 'center', marginBottom: '8px' },
    labelText: { fontWeight: 'bold', fontSize: '16px', color: 'black' },
    input: { width: '100%', height: '50px', padding: '0 16px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: 'white' },
    textarea: { width: '100%', minHeight: '120px', padding: '16px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', fontFamily: 'sans-serif', backgroundColor: 'white' },
    submitButton: { width: '100%', height: '50px', backgroundColor: '#68B648', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' },
    infoText: { textAlign: 'center', color: '#999999', fontSize: '12px', marginBottom: '16px' }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.topBar}>
        <span style={styles.backButton} onClick={onReportSubmitted}>&#x2190;</span>
        <div style={styles.topBarTitle}>Report Seller / Pharmacy</div>
      </div>
      <div style={styles.formContent}>
        <form onSubmit={handleComplaintSubmit}>
          <div style={styles.inputGroup}>
            <div style={styles.labelContainer}>
              <span style={{fontSize: '20px', marginRight: '12px'}}>&#127973;</span>
              <span style={styles.labelText}>Pharmacy Name</span>
            </div>
            <input style={styles.input} type="text" value={pharmacyName} onChange={e => setPharmacyName(e.target.value)} placeholder="Pharmacy Name" required />
          </div>
          <div style={styles.inputGroup}>
            <div style={styles.labelContainer}>
              <span style={{fontSize: '20px', marginRight: '12px'}}>&#128205;</span>
              <span style={styles.labelText}>Location</span>
            </div>
            <input style={styles.input} type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" required />
          </div>
          <div style={styles.inputGroup}>
            <div style={styles.labelContainer}>
              <span style={{fontSize: '20px', marginRight: '12px'}}>&#10067;</span>
              <span style={styles.labelText}>Reason</span>
            </div>
            <input style={styles.input} type="text" value={reason} onChange={e => setReason(e.target.value)} required />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.labelText}>Description</label>
            <textarea style={styles.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" required />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.labelText}>Primary Evidence (from scan)</label>
            {evidenceFile && <img src={URL.createObjectURL(evidenceFile)} alt="Evidence" style={{maxWidth: '100px', marginBottom: '10px', borderRadius: '4px'}} />}
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.labelText}>Upload Additional Images</label>
            <input style={{...styles.input, padding: '8px', height: 'auto'}} type="file" multiple onChange={e => setAdditionalFiles(e.target.files)} />
          </div>
          <button type="submit" style={styles.submitButton} disabled={isSubmitting}>
            <span style={{marginRight: '12px', fontSize: '20px'}}>&#10003;</span>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
          <div style={styles.infoText}>Data will be verified and logged securely.</div>
          {submitStatus && <p style={{ marginTop: '15px', textAlign: 'center' }}>{submitStatus}</p>}
        </form>
      </div>
    </div>
  );
}

export default ReportPage;
