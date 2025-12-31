// src/App.js
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { sha256 } from 'js-sha256';
import axios from 'axios';

// Local Imports
import { db } from './firebase';
import ScannerPage from './ScannerPage';
import ReportPage from './ReportPage';

/**
 * App Configuration
 * In a real production build, these should be in a .env file.
 */
const CONFIG = {
  PINATA_JWT: "YOUR_PINATA_JWT_HERE",
  CONTRACT_ADDRESS: "0xYourSmartContractAddressHere",
  // Minimal ABI: Only including the specific function we interact with to save space
  CONTRACT_ABI: [
    "function storeEvidenceHash(bytes32 reportId, string memory evidenceHash) public"
  ]
};

const App = () => {
  // Application State
  const [activeView, setActiveView] = useState('SCANNER'); // 'SCANNER' | 'REPORT'
  const [capturedEvidence, setCapturedEvidence] = useState(null);
  const [targetPharmacy, setTargetPharmacy] = useState(null);

  /**
   * Transition from Scanner to Report Flow
   * Captures the image and metadata before switching views.
   */
  const handleReportRedirect = (file, pharmacyData) => {
    setCapturedEvidence(file);
    setTargetPharmacy(pharmacyData);
    setActiveView('REPORT');
  };

  /**
   * Reset Flow
   * Clears sensitive data and returns to the home screen.
   */
  const handleReset = () => {
    setCapturedEvidence(null);
    setTargetPharmacy(null);
    setActiveView('SCANNER');
  };

  // Grouping services to pass them cleanly to children
  const commonProps = {
    db,
    ethers,
    sha256,
    axios,
    pinataJWT: CONFIG.PINATA_JWT,
    contractAddress: CONFIG.CONTRACT_ADDRESS,
    contractAbi: CONFIG.CONTRACT_ABI
  };

  return (
    <div className="mediblock-app">
      {activeView === 'SCANNER' ? (
        <ScannerPage 
          onNavigateToReport={handleReportRedirect} 
        />
      ) : (
        <ReportPage 
          evidenceFile={capturedEvidence}
          selectedPharmacy={targetPharmacy}
          onReportSubmitted={handleReset}
          {...commonProps} // Spreading props keeps the code clean
        />
      )}
    </div>
  );
};

export default App;
