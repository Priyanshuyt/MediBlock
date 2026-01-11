import os
import numpy as np
from backend.feature_extraction import extract_fingerprint

IMAGE_DIR = "test_images"

fingerprints = []
image_names = []

# ---- Extract & print fingerprints ----
for img_name in sorted(os.listdir(IMAGE_DIR)):
    img_path = os.path.join(IMAGE_DIR, img_name)
    fp = extract_fingerprint(img_path)
    fingerprints.append(fp)
    image_names.append(img_name)

    # format values to match your example
    formatted_fp = [round(v, 4) for v in fp]
    print(f"{img_name} → {formatted_fp}")

# ---- Convert to numpy ----
X = np.array(fingerprints)

# ---- Mean & Std ----
mean_fp = np.mean(X, axis=0)
std_fp = np.std(X, axis=0)

# formatting
mean_fp_fmt = [round(v, 4) for v in mean_fp]
std_fp_fmt = [round(v, 4) for v in std_fp]

print("\nMean fingerprint:", mean_fp_fmt)
print("Std deviation   :", std_fp_fmt)
