// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MediBlock Ledger
 * @dev Stores immutable proof of tablet verification results.
 */
contract MediBlock {
    
    struct VerificationRecord {
        string batchId;
        string reportHash; // SHA-256 hash of the full off-chain report
        bool isGenuine;    // True = PASS, False = FAIL
        uint256 timestamp;
        address verifier;
    }

    // Mapping to store records: Batch ID -> Record
    mapping(string => VerificationRecord) public records;
    
    // Event to notify the frontend/regulator
    event LogVerification(string indexed batchId, bool isGenuine, uint256 timestamp);

    function storeResult(string memory _batchId, string memory _reportHash, bool _isGenuine) public {
        
        records[_batchId] = VerificationRecord({
            batchId: _batchId,
            reportHash: _reportHash,
            isGenuine: _isGenuine,
            timestamp: block.timestamp,
            verifier: msg.sender
        });

        emit LogVerification(_batchId, _isGenuine, block.timestamp);
    }
    
    // Helper function for regulators to check a batch
    function getBatchStatus(string memory _batchId) public view returns (bool, uint256) {
        return (records[_batchId].isGenuine, records[_batchId].timestamp);
    }
}
