import time
from model_engine import AnomalyDetector

def main():
    print("Initializing MediBlock System...")
    detector = AnomalyDetector()
    
    # Test Image Path (Change this to a real file path on your PC)
    test_image = "samples/test_tablet.jpg" 
    
    print(f"Scanning tablet: {test_image}...")
    
    # Simulate processing time
    time.sleep(1)
    
    try:
        result, score = detector.verify_tablet(test_image)
        
        print("\n" + "="*30)
        print("  MEDIBLOCK VERIFICATION REPORT")
        print("="*30)
        print(f"Status:      {result}")
        print(f"Confidence:  {score:.4f}")
        print("-" * 30)
        
        if result == "PASS":
            print(">> Batch Accepted. Logging to Blockchain...")
        else:
            print(">> ALARM: ANOMALY DETECTED! Rejecting Batch.")
            print(">> Flagging Seller ID on Blockchain...")
            
    except Exception as e:
        print(f"Error during scan: {e}")
        print("Did you put a valid image in the 'samples' folder?")

if __name__ == "__main__":
    main()
