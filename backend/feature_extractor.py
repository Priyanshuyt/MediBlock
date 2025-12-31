import cv2
import numpy as np
from skimage.feature import graycomatrix, graycoprops

class TabletFeatureExtractor:
    """
    This class handles all the Computer Vision tasks.
    It takes an image path and returns the 4 key features we need for the fingerprint.
    """
    
    def preprocess_image(self, image_path):
        # Basic setup: Load image -> Grayscale -> Blur to remove noise
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Error: Could not read image at {image_path}")
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Using a 5x5 Gaussian blur to smooth out dust particles so they don't count as 'roughness'
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        return img, gray, blurred

    def get_texture_T(self, gray_img):
        """
        Calculates Surface Texture (T) using GLCM Contrast.
        """
        # We compute the Gray-Level Co-occurrence Matrix
        # distances=[1], angles=[0] looks at the pixel immediately to the right
        glcm = graycomatrix(gray_img, distances=[1], angles=[0], levels=256, symmetric=True, normed=True)
        
        # Extract contrast - rough surfaces have high contrast
        contrast = graycoprops(glcm, 'contrast')[0, 0]
        return contrast

    def get_roughness_E(self, gray_img):
        """
        Calculates Edge Roughness (E) using Radial Variance.
        """
        # 1. Canny Edge Detection
        edges = cv2.Canny(gray_img, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return 0.0 # Safety check
            
        # 2. Assume the biggest contour is the tablet
        cnt = max(contours, key=cv2.contourArea)
        
        # 3. Find the center (Centroid)
        M = cv2.moments(cnt)
        if M["m00"] == 0: return 0.0
        cx = int(M["m10"] / M["m00"])
        cy = int(M["m01"] / M["m00"])
        
        # 4. Measure distance from center to every point on the edge
        distances = []
        for point in cnt:
            px, py = point[0]
            dist = np.sqrt((px - cx)**2 + (py - cy)**2)
            distances.append(dist)
            
        # 5. Calculate Variance (High variance = Jagged/Rough edge)
        return np.var(distances)

    def get_depth_D(self, gray_img):
        """
        Calculates Imprint Depth (D) via Shadow Intensity.
        """
        # We use Sobel operators to find gradients (shadow edges)
        sobelx = cv2.Sobel(gray_img, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray_img, cv2.CV_64F, 0, 1, ksize=3)
        
        # Gradient magnitude tells us how 'strong' the shadow edges are
        gradient_magnitude = np.sqrt(sobelx**2 + sobely**2)
        return np.mean(gradient_magnitude)

    def get_coating_C(self, gray_img):
        """
        Calculates Coating Uniformity (C).
        """
        # Standard deviation of pixel brightness.
        # Uniform coating = Low Std Dev. Blotchy coating = High Std Dev.
        return np.std(gray_img)

    def extract_vector(self, image_path):
        """
        Master function: Calls all the above to get the [T, E, D, C] vector.
        """
        _, gray, blurred = self.preprocess_image(image_path)
        
        T = self.get_texture_T(gray)
        E = self.get_roughness_E(blurred) # Use blurred for edge detection
        D = self.get_depth_D(gray)
        C = self.get_coating_C(gray)
        
        # Debug print to see what values we are getting
        # print(f"DEBUG: Extracted -> T:{T:.2f}, E:{E:.2f}, D:{D:.2f}, C:{C:.2f}")
        
        return [T, E, D, C]
