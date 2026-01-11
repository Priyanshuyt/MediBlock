"""
Feature Extraction Module
-------------------------
Extracts visual and geometric features from a tablet image
to create a unique fingerprint for verification.
"""

import cv2
import numpy as np


def extract_fingerprint(image_path):
    """
    Convert a tablet image into a numerical feature vector.
    """
    image = cv2.imread(image_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # --- Preprocessing ---
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, binary = cv2.threshold(
        blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
    )

    contours, _ = cv2.findContours(
        binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    if not contours:
        raise ValueError("No tablet detected in the image")

    tablet_contour = max(contours, key=cv2.contourArea)

    # --- Shape features ---
    area = cv2.contourArea(tablet_contour)
    x, y, w, h = cv2.boundingRect(tablet_contour)
    aspect_ratio = w / h

    # --- Edge roughness ---
    perimeter = cv2.arcLength(tablet_contour, True)
    edge_roughness = perimeter / (2 * np.sqrt(np.pi * area))

    # --- Texture statistics ---
    texture_variation = np.std(gray)

    # --- Imprint depth (gradient strength) ---
    grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    imprint_depth = np.mean(np.sqrt(grad_x**2 + grad_y**2))

    # --- Coating uniformity ---
    coating_uniformity = np.var(gray)

    return [
        float(texture_variation),
        float(edge_roughness),
        float(imprint_depth),
        float(coating_uniformity),
        float(area),
        float(aspect_ratio),
    ]