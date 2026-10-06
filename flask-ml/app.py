from flask import Flask, request, jsonify
from flask_cors import CORS
from model.predict import predict

app = Flask(__name__)
CORS(app)


@app.route("/api/predict", methods=["POST"])
def ml_predict():
    payload = request.get_json()
    if not payload:
        return jsonify({"error": "Empty request body"}), 400

    required = ["systolic_bp", "diastolic_bp", "heart_rate", "weight_kg", "pregnancy_week"]
    missing = [f for f in required if payload.get(f) is None]
    if missing:
        return jsonify({"error": f"Missing required fields: {missing}"}), 400

    try:
        result = predict(payload)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "mamaai-ml"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
