"""
MediBlock Backend API
--------------------
A simple Flask application that verifies medicine tablets
using image-based fingerprinting and ML models.
"""

from flask import Flask, request, jsonify
import os

from .verify_model_A import verify_image_A
from .verify_model_B import verify_image_B

app = Flask(__name__)


@app.route("/")
def home():
    """Health check endpoint."""
    return {
        "status": "OK",
        "message": "MediBlock backend is up and running"
    }


@app.route("/verify", methods=["POST"])
def verify():
    """
    Accepts:
    - medicine: medicine type (medicine_A or medicine_B)
    - image: uploaded tablet image

    Returns:
    - verification status and message
    """
    medicine_type = request.form["medicine"]
    image_file = request.files["image"]

    # Save uploaded image temporarily
    temp_dir = "backend/temp"
    os.makedirs(temp_dir, exist_ok=True)

    image_path = os.path.join(temp_dir, image_file.filename)
    image_file.save(image_path)

    # Route verification to the correct model
    if medicine_type == "medicine_A":
        status, message = verify_image_A(image_path)
    else:
        status, message = verify_image_B(image_path)

    return jsonify({
        "status": status,
        "message": message
    })


if __name__ == "__main__":
    app.run(debug=True)