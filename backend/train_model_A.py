import os
import json
import numpy as np
import joblib
from backend.feature_extraction import extract_fingerprint
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest

# --------------------------------------------------
# CONFIG
# --------------------------------------------------
BASE_DIR = "train_data/medicine_A"
MODEL_DIR = "models/medicine_A"

os.makedirs(MODEL_DIR, exist_ok=True)

fingerprints = []
tablet_ids = []

print("\n🔍 Training Model-A (Medicine A)\n")

# --------------------------------------------------
# 1️⃣ Extract fingerprints from all tablets
# --------------------------------------------------
for tablet in sorted(os.listdir(BASE_DIR)):
    tablet_path = os.path.join(BASE_DIR, tablet)

    if not os.path.isdir(tablet_path):
        continue

    for img in sorted(os.listdir(tablet_path)):
        img_path = os.path.join(tablet_path, img)

        fp = extract_fingerprint(img_path)
        fingerprints.append(fp)
        tablet_ids.append(tablet)

        print(f"{tablet}/{img} → {[round(v,4) for v in fp]}")

X = np.array(fingerprints)

print(f"\n✅ Total samples used: {len(X)}")
print(f"✅ Tablets used: {len(set(tablet_ids))}")

# --------------------------------------------------
# 2️⃣ Normalize features
# --------------------------------------------------
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# --------------------------------------------------
# 3️⃣ Train Isolation Forest
# --------------------------------------------------
model = IsolationForest(
    n_estimators=200,
    contamination=0.05,
    random_state=42
)

model.fit(X_scaled)

# --------------------------------------------------
# 4️⃣ Save model & scaler
# --------------------------------------------------
joblib.dump(model, f"{MODEL_DIR}/model.pkl")
joblib.dump(scaler, f"{MODEL_DIR}/scaler.pkl")

# --------------------------------------------------
# 5️⃣ Save geometry reference (CRITICAL)
# Fingerprint format:
# [Texture, Edge, Depth, Coating, Area, AspectRatio]
# --------------------------------------------------
areas = X[:, 4]
aspects = X[:, 5]

geometry_ref = {
    "mean_area": float(np.mean(areas)),
    "mean_aspect_ratio": float(np.mean(aspects)),
    "area_tolerance": 0.35,      # 35% size tolerance
    "aspect_tolerance": 0.15     # 15% shape tolerance
}

with open(f"{MODEL_DIR}/geometry.json", "w") as f:
    json.dump(geometry_ref, f, indent=4)

print("\n📐 Geometry reference saved:")
print(geometry_ref)

# --------------------------------------------------
# 6️⃣ Save metadata
# --------------------------------------------------
meta = {
    "medicine_id": "medicine_A",
    "total_images": len(X),
    "tablets_used": len(set(tablet_ids)),
    "features": [
        "Texture",
        "Edge Roughness",
        "Imprint Depth",
        "Coating Uniformity",
        "Area",
        "Aspect Ratio"
    ],
    "model_type": "IsolationForest",
    "training_strategy": "multi-tablet genuine only"
}

with open(f"{MODEL_DIR}/meta.json", "w") as f:
    json.dump(meta, f, indent=4)

# --------------------------------------------------
# 7️⃣ Training sanity check
# --------------------------------------------------
scores = model.decision_function(X_scaled)

print("\n📊 Training deviation summary:")
print(f"Min score : {round(scores.min(),4)}")
print(f"Max score : {round(scores.max(),4)}")
print(f"Mean score: {round(scores.mean(),4)}")

print("\n🎉 MODEL-A TRAINING COMPLETE\n")
