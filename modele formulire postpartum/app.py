from flask import Flask, request, jsonify
import pandas as pd
import joblib

app = Flask(__name__)

# ---- Fonction requise par le pipeline pickle ----
def enrich_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Normalisation simple
    for col in df.columns:
        if df[col].dtype == object:
            df[col] = df[col].astype(str).str.strip()

    # 1) severe_symptom_count
    severe_count = 0

    severe_count += (df["Feeling sad or Tearful"] == "Yes").astype(int)
    severe_count += (df["Irritable towards baby & partner"] == "Yes").astype(int)
    severe_count += (df["Trouble sleeping at night"] == "Yes").astype(int)
    severe_count += (df["Problems concentrating or making decision"] == "Often").astype(int)
    severe_count += (df["Overeating or loss of appetite"] == "Yes").astype(int)
    severe_count += (df["Feeling anxious"] == "Yes").astype(int)
    severe_count += (df["Feeling of guilt"] == "Yes").astype(int)
    severe_count += (df["Problems of bonding with baby"] == "Yes").astype(int)
    severe_count += (df["Suicide attempt"] == "Yes").astype(int)

    df["severe_symptom_count"] = severe_count

    # 2) sleep_issue_flag
    df["sleep_issue_flag"] = (df["Trouble sleeping at night"] == "Yes").astype(int)

    # 3) decision_issue_flag
    df["decision_issue_flag"] = (
        df["Problems concentrating or making decision"] == "Often"
    ).astype(int)

    # 4) crisis_flag
    df["crisis_flag"] = (df["Suicide attempt"] == "Yes").astype(int)

    return df

# ---- Charger le modèle après définition de la fonction ----
model = joblib.load("ppd_model_pipeline.pkl")

RISK_LABELS = {
    0: "Low",
    1: "Moderate",
    2: "High"
}

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        input_df = pd.DataFrame([{
            "Age": data["age"],
            "Feeling sad or Tearful": data["feelingSadOrTearful"],
            "Irritable towards baby & partner": data["irritableTowardsBabyPartner"],
            "Trouble sleeping at night": data["troubleSleepingAtNight"],
            "Problems concentrating or making decision": data["problemsConcentratingOrMakingDecision"],
            "Overeating or loss of appetite": data["overeatingOrLossOfAppetite"],
            "Feeling anxious": data["feelingAnxious"],
            "Feeling of guilt": data["feelingOfGuilt"],
            "Problems of bonding with baby": data["problemsOfBondingWithBaby"],
            "Suicide attempt": data["suicideAttempt"]
        }])

        prediction = model.predict(input_df)[0]
        probabilities = model.predict_proba(input_df)[0]

        response = {
            "riskLabel": int(prediction),
            "riskLevel": RISK_LABELS[int(prediction)],
            "confidence": float(max(probabilities)),
            "probabilities": {
                "low": float(probabilities[0]),
                "moderate": float(probabilities[1]),
                "high": float(probabilities[2])
            }
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)