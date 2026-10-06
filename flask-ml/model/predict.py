import joblib, json, numpy as np, os

BASE  = os.path.dirname(__file__)
model = joblib.load(os.path.join(BASE, "vitals_model.pkl"))
with open(os.path.join(BASE, "model_metadata.json")) as f:
    META = json.load(f)

FEATURES    = META["features"]
LABEL_NAMES = {int(k): v for k, v in META["label_names"].items()}
# 0=Low, 1=Moderate, 2=High, 3=Critical

DEFAULTS = {
    "glucose_mmol":  5.0,
    "temperature_c": 37.0,
    "oxygen_pct":    98,
}

SCORE_RANGES   = {0:(80,100), 1:(60,79), 2:(40,59), 3:(0,39)}
RECOMMENDATIONS = {
    0: "Your vitals look good. Keep up with routine check-ups and stay hydrated.",
    1: "Some vitals need attention. Rest, monitor closely and inform your doctor at next visit.",
    2: "Your vitals are concerning. Please contact your doctor today and rest immediately.",
    3: "Critical values detected. Seek medical attention immediately or call emergency services.",
}

def _assess_bp(s,d):
    if s>=160 or d>=110: return "Critical"
    if s>=140 or d>=90:  return "High"
    if s>=130 or d>=80:  return "Moderate"
    return "Normal"

def _assess_hr(hr):
    if hr>130 or hr<45:  return "Critical"
    if hr>120 or hr<50:  return "High"
    if hr>100 or hr<55:  return "Moderate"
    return "Normal"

def _assess_o2(o2):
    if o2<92: return "Critical"
    if o2<94: return "High"
    if o2<96: return "Moderate"
    return "Normal"

def _assess_glucose(g):
    if g>11.0 or g<3.0: return "Critical"
    if g>8.5  or g<3.5: return "High"
    if g>7.0  or g<4.0: return "Moderate"
    return "Normal"

def _assess_temp(t):
    if t>39.5 or t<35.5: return "Critical"
    if t>38.5 or t<36.0: return "High"
    if t>37.8 or t<36.2: return "Moderate"
    return "Normal"

def _factors(data, used_defaults):
    factors = []
    bp = _assess_bp(data["systolic_bp"], data["diastolic_bp"])
    hr = _assess_hr(data["heart_rate"])
    o2 = _assess_o2(data["oxygen_pct"])
    gl = _assess_glucose(data["glucose_mmol"])
    tp = _assess_temp(data["temperature_c"])

    if bp in ("High","Critical"): factors.append(f"Blood pressure elevated ({data['systolic_bp']}/{data['diastolic_bp']} mmHg)")
    elif bp == "Moderate":        factors.append(f"Blood pressure borderline ({data['systolic_bp']}/{data['diastolic_bp']} mmHg)")
    if hr != "Normal":            factors.append(f"Heart rate {hr.lower()} ({data['heart_rate']} bpm)")
    if o2 != "Normal" and "oxygen_pct"    not in used_defaults: factors.append(f"Oxygen saturation {o2.lower()} ({data['oxygen_pct']}%)")
    if gl != "Normal" and "glucose_mmol"  not in used_defaults: factors.append(f"Glucose {gl.lower()} ({data['glucose_mmol']} mmol/L)")
    if tp != "Normal" and "temperature_c" not in used_defaults: factors.append(f"Temperature {tp.lower()} ({data['temperature_c']} °C)")
    if not factors: factors.append("All vitals within acceptable range")
    return factors

def predict(payload: dict) -> dict:
    used_defaults = []
    data = dict(payload)
    for key, val in DEFAULTS.items():
        if data.get(key) is None or data.get(key) == 0:
            data[key] = val
            used_defaults.append(key)

    week      = int(data.get("pregnancy_week", 20))
    trimester = 1 if week <= 12 else (2 if week <= 26 else 3)
    data["trimester"] = trimester

    X          = np.array([[data[f] for f in FEATURES]])
    risk_class = int(model.predict(X)[0])
    probas     = model.predict_proba(X)[0]
    confidence = float(probas[risk_class])

    lo, hi     = SCORE_RANGES[risk_class]
    risk_score = int(lo + (hi - lo) * confidence)

    tri_label = {1:"First", 2:"Second", 3:"Third"}[trimester]

    return {
        "risk_level":     LABEL_NAMES[risk_class],
        "risk_score":     risk_score,
        "confidence":     round(confidence, 2),
        "factors":        _factors(data, used_defaults),
        "recommendation": RECOMMENDATIONS[risk_class],
        "week_context":   f"Week {week} — {tri_label} trimester",
        "used_defaults":  used_defaults,
        "individual_status": {
            "blood_pressure": _assess_bp(data["systolic_bp"], data["diastolic_bp"]),
            "heart_rate":     _assess_hr(data["heart_rate"]),
            "oxygen":         _assess_o2(data["oxygen_pct"]),
            "glucose":        _assess_glucose(data["glucose_mmol"]),
            "temperature":    _assess_temp(data["temperature_c"]),
        }
    }
