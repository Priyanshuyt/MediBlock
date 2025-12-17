// src/VerifyTamper.js
import React, { useState, useEffect } from 'react';
// Import onSnapshot for real-time updates
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

function VerifyTamper({ contractAddress, contractAbi, db, sha256, ethers }) {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  
  // State for the tampered data form
  const [tamperedPharmacyName, setTamperedPharmacyName] = useState('');
  const [tamperedLocation, setTamperedLocation] = useState('');
  const [tamperedReason, setTamperedReason] = useState('');
  const [tamperedDescription, setTamperedDescription] = useState('');

  // State for verification results
  const [blockchainHash, setBlockchainHash] = useState('');
  const [tamperedDataHash, setTamperedDataHash] = useState('');
  const [comparisonResult, setComparisonResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // This useEffect now uses onSnapshot to listen for real-time changes
  useEffect(() => {
    setLoading(true);
    const complaintsCollectionRef = collection(db, 'complaints');
    const q = query(complaintsCollectionRef, orderBy("createdAt", "desc"));

    // onSnapshot returns an unsubscribe function
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const complaintsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date(0),
      }));
      
      setComplaints(complaintsList);
      
      // If no complaint is selected yet, select the newest one
      if (!selectedComplaintId && complaintsList.length > 0) {
        setSelectedComplaintId(complaintsList[0].id);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching complaints:", err);
      setError("Failed to load complaints in real-time.");
      setLoading(false);
    });

    // Cleanup: unsubscribe from the listener when the component is unmounted
    return () => unsubscribe();
  }, [db, selectedComplaintId]); // Dependency array updated

  // This useEffect updates the form fields when a complaint is selected
  useEffect(() => {
    if (selectedComplaintId && complaints.length > 0) {
      const complaint = complaints.find(c => c.id === selectedComplaintId);
      setSelectedComplaint(complaint);
      if (complaint) {
        setTamperedPharmacyName(complaint.pharmacyName);
        setTamperedLocation(complaint.location);
        setTamperedReason(complaint.reason);
        setTamperedDescription(complaint.description);
        // Clear previous results
        setBlockchainHash('');
        setTamperedDataHash('');
        setComparisonResult('');
        setError('');
      }
    }
  }, [selectedComplaintId, complaints]);

  const handleVerifyTamper = async () => {
    if (!selectedComplaint) {
      setError("Please select a complaint first.");
      return;
    }
    setLoading(true);
    setError('');
    setBlockchainHash('');
    setTamperedDataHash('');
    setComparisonResult('');

    try {
      if (!window.ethereum) throw new Error("MetaMask is not installed.");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractAbi, provider);

      const originalCombinedString = `${selectedComplaint.pharmacyName}-${selectedComplaint.location}-${selectedComplaint.reason}-${selectedComplaint.description}-${selectedComplaint.ipfsCid}-${selectedComplaint.reportTimestamp}`;
      const originalReportId = ethers.keccak256(ethers.toUtf8Bytes(originalCombinedString));

      const originalEvidenceHashAndCid = await contract.getEvidenceHash(originalReportId);
      if (!originalEvidenceHashAndCid || originalEvidenceHashAndCid.length === 0) {
        throw new Error('Blockchain returned no data. The Report ID did not match any record.');
      }
      
      const originalSha256 = originalEvidenceHashAndCid.split('_')[0];
      setBlockchainHash(originalSha256);
      
      const tamperedCombinedString = `${tamperedPharmacyName}-${tamperedLocation}-${tamperedReason}-${tamperedDescription}-${selectedComplaint.ipfsCid}-${selectedComplaint.reportTimestamp}`;
      const recalculatedSha256 = sha256(tamperedCombinedString);
      setTamperedDataHash(recalculatedSha256);

      if (recalculatedSha256 === originalSha256) {
        setComparisonResult("✅ SUCCESS: Data MATCHES the blockchain record! (Untampered)");
      } else {
        setComparisonResult("❌ ALERT: Data DOES NOT MATCH the blockchain record! (TAMPERED!)");
      }

    } catch (err) {
      setError(`Failed to verify: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '20px' }}>
      <h2>Verify Complaint / Tamper Proof Demo</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      <div>
        <label>Select a Complaint:</label>
        <select value={selectedComplaintId} onChange={(e) => setSelectedComplaintId(e.target.value)} disabled={loading || complaints.length === 0}>
          {loading && <option>Loading...</option>}
          {complaints.length === 0 && !loading && <option>No complaints found</option>}
          {complaints.map(complaint => (
            <option key={complaint.id} value={complaint.id}>
              {complaint.pharmacyName} - {new Date(complaint.createdAt).toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      {selectedComplaint && (
        <div style={{ border: '1px dashed #ccc', padding: '15px', margin: '20px 0' }}>
          <h3>Simulate Tampering:</h3>
          <p>Edit the fields below. If they don't match the original, the verification will fail.</p>
          <div><label>Pharmacy Name:</label><input type="text" value={tamperedPharmacyName} onChange={(e) => setTamperedPharmacyName(e.target.value)} /></div>
          <div><label>Location:</label><input type="text" value={tamperedLocation} onChange={(e) => setTamperedLocation(e.target.value)} /></div>
          <div><label>Reason:</label><input type="text" value={tamperedReason} onChange={(e) => setTamperedReason(e.target.value)} /></div>
          <div><label>Description:</label><textarea value={tamperedDescription} onChange={(e) => setTamperedDescription(e.target.value)}></textarea></div>
          <button onClick={handleVerifyTamper} disabled={loading} style={{marginTop: '10px'}}>{loading ? 'Verifying...' : 'Verify against Blockchain'}</button>

          {comparisonResult && (
            <div style={{ marginTop: '20px', padding: '15px', border: comparisonResult.includes("DOES NOT MATCH") ? '2px solid red' : '2px solid green' }}>
              <p style={{ fontWeight: 'bold', whiteSpace: 'pre-wrap' }}>{comparisonResult}</p>
              <p><strong>Blockchain's Original Hash:</strong> {blockchainHash}</p>
              <p><strong>Current Data's Re-calculated Hash:</strong> {tamperedDataHash}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VerifyTamper;
