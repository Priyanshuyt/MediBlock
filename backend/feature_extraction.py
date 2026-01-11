import cv2
import numpy as np

def extract_fingerprint(image_path):
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # -----------------------------
    # Preprocessing
    # -----------------------------
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blur, 0, 255,
                              cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    contours, _ = cv2.findContours(
        thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    if len(contours) == 0:
        raise ValueError("No tablet contour detected")

    cnt = max(contours, key=cv2.contourArea)

    # -----------------------------
    # SHAPE FEATURES (NEW)
    # -----------------------------
    area = cv2.contourArea(cnt)

    x, y, w, h = cv2.boundingRect(cnt)
    aspect_ratio = w / h

    # -----------------------------
    # EDGE ROUGHNESS
    # -----------------------------
    perimeter = cv2.arcLength(cnt, True)
    edge_roughness = perimeter / (2 * np.sqrt(np.pi * area))

    # -----------------------------
    # TEXTURE (GLCM-LIKE)
    # -----------------------------
    texture = np.std(gray)

    # -----------------------------
    # IMPRINT DEPTH (Gradient)
    # -----------------------------
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    imprint_depth = np.mean(np.sqrt(sobelx**2 + sobely**2))

    # -----------------------------
    # COATING UNIFORMITY
    # -----------------------------
    coating_uniformity = np.var(gray)

    return [
        float(texture),
        float(edge_roughness),
        float(imprint_depth),
        float(coating_uniformity),
        float(area),
        float(aspect_ratio)
    ]
