import joblib
import numpy as np
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler
from src.feature_extractor import TabletFeatureExtractor

class AnomalyDetector:
    def __init__(self, model_path='models/mediblock_model.pkl', scaler_path='models/mediblock_scaler.pkl'):
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.model = None
        self.scaler = None
        self.feature_extractor = TabletFeatureExtractor()
        
    def load_resources(self):
        """Checks if the trained model exists and loads it."""
        try:
            self.model = joblib.load(self.model_path)
            self.scaler = joblib.load(self.scaler_path)
            # print("DEBUG: Model loaded successfully.")
            return True
        except FileNotFoundError:
            print("ERROR: Model files not found! Did you run 'train_model.py'?")
            return False

    def verify_tablet(self, image_path):
        """
        The main verification function.
        Returns: 
            result (str): "PASS" or "FAIL"
            distance (float): How far the tablet is from the decision boundary.
        """
        if self.model is None:
            if not self.load_resources():
                return "ERROR", 0.0

        # 1. Extract the fingerprint [T, E, D, C]
        feature_vector = self.feature_extractor.extract_vector(image_path)
        
        # 2. Reshape for the model (it expects a 2D array)
        vector_np = np.array([feature_vector])
        
        # 3. Scale the data (Crucial step! Uses the same scaler as training)
        vector_scaled = self.scaler.transform(vector_np)
        
        # 4. Predict
        # OneClassSVM output: 1 = Inlier (Pass), -1 = Outlier (Fail)
        prediction = self.model.predict(vector_scaled)
        
        # 5. Get Confidence Score (Signed Distance to Hyperplane)
        distance = self.model.decision_function(vector_scaled)[0]
        
        result = "PASS" if prediction[0] == 1 else "FAIL"
        
        return result, distance
