"""
Medicine B Verification Logic
-----------------------------
Identical pipeline to Medicine A but uses
a different trained model and geometry profile.
"""

import os
import json
import joblib

from .feature_extraction import extract_fingerprint

BASE_DIR = os.path.dirname(__file__)
MODEL_DIR = os.path.join(BASE_DIR, "models", "medicine_B")

DECISION_THRESHOLD = -0.13

model = joblib.load(os.path.join(MODEL_DIR, "model.pkl"))
scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))

with open(os.path.join(MODEL_DIR, "geometry.json")) as f:
    geometry = json.load(f)

MEAN_AREA = geometry["mean_area"]
MEAN_ASPECT_RATIO = geometry["mean_aspect_ratio"]

AREA_TOLERANCE = 0.08
ASPECT_TOLERANCE = 0.05


def verify_image_B(image_path):
    """Verify a Medicine B tablet image."""
    features = extract_fingerprint(image_path)
    area, aspect_ratio = features[4], features[5]

    if abs(area - MEAN_AREA) / MEAN_AREA > AREA_TOLERANCE:
        return "FAIL", "Tablet size does not match"

    if abs(aspect_ratio - MEAN_ASPECT_RATIO) / MEAN_ASPECT_RATIO > ASPECT_TOLERANCE:
        return "FAIL", "Tablet shape does not match"

    score = model.decision_function(
        scaler.transform([features])
    )[0]

    if score > DECISION_THRESHOLD:
        return "PASS", "Genuine tablet detected"

    return "FAIL", "Possible surface anomaly detected"