import os
import glob
import numpy as np
import joblib
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler
from feature_extractor import TabletFeatureExtractor

def train_anomaly_detector(training_folder="../samples/genuine"):
    """
    Trains the One-Class SVM on genuine images only.
    """
    print("--- STARTING TRAINING ---")
    
    # 1. Find images
    # Supports jpg, png, and jpeg
    extensions = ['*.jpg', '*.png', '*.jpeg']
    image_paths = []
    for ext in extensions:
        image_paths.extend(glob.glob(os.path.join(training_folder, ext)))
    
    if not image_paths:
        print(f"No images found in {training_folder}. Please add sample images!")
        return

    print(f"Found {len(image_paths)} genuine samples. Extracting features...")
    
    extractor = TabletFeatureExtractor()
    features = []
    
    # 2. Build dataset
    for path in image_paths:
        try:
            vec = extractor.extract_vector(path)
            features.append(vec)
            print(f"Processed: {os.path.basename(path)}")
        except Exception as e:
            print(f"Skipping {path}: {e}")
            
    if not features:
        print("Feature extraction failed.")
        return

    X_train = np.array(features)
    
    # 3. Scaling
    print("Scaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    # 4. Fit Model
    # nu=0.05 allows 5% of training data to be considered outliers (noise tolerance)
    print("Training One-Class SVM...")
    model = OneClassSVM(kernel='rbf', gamma='scale', nu=0.05)
    model.fit(X_train_scaled)
    
    # 5. Save Model & Scaler
    if not os.path.exists('models'):
        os.makedirs('models')
        
    joblib.dump(model, 'models/mediblock_model.pkl')
    joblib.dump(scaler, 'models/mediblock_scaler.pkl')
    
    print("--- TRAINING COMPLETE ---")
    print("Model saved to 'models/' folder.")

if __name__ == "__main__":
    # You can change this path to wherever your training images are
    train_anomaly_detector()
