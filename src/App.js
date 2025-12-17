import React, { useState } from 'react';
import './App.css';
import { db } from './firebase';
import { ethers } from 'ethers';
import { sha256 } from 'js-sha256';
import axios from 'axios';

import HomePage from './HomePage';
import ScanPage from './ScanPage';
import ReportPage from './ReportPage';
import VerifyPage from './VerifyPage';
import MapPage from './MapPage';
import BottomNav from './BottomNav';

// --- YOUR KEYS & ADDRESS ---
const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxNzAwY2ZjZS01ZDJkLTRlYjYtOTVhNi0zMzFhMzgxOWEwN2MiLCJlbWFpbCI6InByaXlhbnNodWt1bWFyMDE2NThAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImJhZWQ4ZWIyYjljZmY1NmFmYjk3Iiwic2NvcGVkS2V5U2VjcmV0IjoiMTlhMjc2ZTEyN2I2NmVmMDI3MWE3ZTFjOGJiOGY4YmY5MTcxMmE3NzQ4NTVmMDVlMmY2MzY4MGQ1ZjVhNTE1NiIsImV4cCI6MTc4NDgxNTA1OX0.-6Yovg8_49lKYB2JCl4gLUR74Q3nLpK30PwZUrPlZhk";
const CONTRACT_ADDRESS =  "0xb1523e203ceed7d65cfec04a6b0931ba78b89181";;
const CONTRACT_ABI = [
  "function storeEvidenceHash(bytes32 _reportId, string calldata _evidenceHashAndCid) public",
  "function getEvidenceHash(bytes32 _reportId) public view returns (string memory)"
];

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [evidenceForReport, setEvidenceForReport] = useState(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);

  const navigateToReport = (file) => {
    setEvidenceForReport(file);
    setCurrentPage('report');
  };

  const navigateFromMapToScan = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setCurrentPage('scan');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage navigate={setCurrentPage} />;
      case 'scan':
        return <ScanPage onFileComplaint={navigateToReport} />;
      case 'report':
        return <ReportPage
          evidenceFile={evidenceForReport}
          selectedPharmacy={selectedPharmacy}
          onReportSubmitted={() => {
            setSelectedPharmacy(null);
            setCurrentPage('scan');
          }}
          db={db} contractAddress={CONTRACT_ADDRESS} contractAbi={CONTRACT_ABI}
          pinataJWT={PINATA_JWT} ethers={ethers} sha256={sha256} axios={axios}
        />;
      case 'verify':
        return <VerifyPage
          db={db} contractAddress={CONTRACT_ADDRESS} contractAbi={CONTRACT_ABI}
          sha256={sha256} ethers={ethers}
        />;
      case 'map':
        return <MapPage onPharmacySelect={navigateFromMapToScan} />;
      default:
        return <HomePage navigate={setCurrentPage} />;
    }
  };

  const showBottomNav = currentPage !== 'report';

  return (
    <div className="App" style={{ paddingBottom: '70px' }}>
      {renderPage()}
      {showBottomNav && <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />}
    </div>
  );
}

export default App;
