import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

class DatabaseHandler:
    """
    Handles all interactions with Google Firebase (Firestore).
    We use this to store the 'Heavy' data (Images, detailed logs) that is too expensive
    to put directly on the Blockchain.
    """
    
    def __init__(self):
        # Prevent initializing the app multiple times if the script restarts
        if not firebase_admin._apps:
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
            
        self.db = firestore.client()
        self.collection_name = "batch_records"

    def save_verification_record(self, batch_id, result, score, vector):
        """
        Saves the scan result to the Cloud Database.
        """
        try:
            # Create a structured document
            data = {
                "batch_id": batch_id,
                "status": result,      # PASS or FAIL
                "confidence_score": float(score),
                "fingerprint_vector": [float(x) for x in vector], # Store the [T,E,D,C]
                "timestamp": datetime.now(),
                "verified_by": "Distributor_Node_01"
            }
            
            # Save it! (This corresponds to '1.0 Save Full Data' in the DFD)
            self.db.collection(self.collection_name).document(batch_id).set(data)
            
            print(f"DEBUG: Successfully logged Batch {batch_id} to Firebase.")
            return True
            
        except Exception as e:
            print(f"ERROR: Failed to save to Firebase: {e}")
            return False

    def get_record(self, batch_id):
        """Helper to fetch data back (for the Regulator Dashboard)"""
        doc = self.db.collection(self.collection_name).document(batch_id).get()
        if doc.exists:
            return doc.to_dict()
        return None
