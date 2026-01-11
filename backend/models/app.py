from flask import Flask, request, jsonify
import os
from .verify_model_A import verify_image_A
from .verify_model_B import verify_image_B

app = Flask(__name__)

@app.route("/")
def home():
    return {"status": "OK", "message": "MediBlock backend running"}

@app.route("/verify", methods=["POST"])
def verify():
    
    medicine = request.form["medicine"]
    image = request.files["image"]

    os.makedirs("backend/temp", exist_ok=True)
    path = f"backend/temp/{image.filename}"
    image.save(path)

    if medicine == "medicine_A":
        status, message = verify_image_A(path)
    else:
        status, message = verify_image_B(path)

    return jsonify({"status": status, "message": message})

if __name__ == "__main__":
    app.run(debug=True)
