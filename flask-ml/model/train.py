"""
train.py — MAMAAI ML Model Training
=====================================
Custom synthetic dataset built from 17 clinical profile types:
  healthy, bp_moderate/high/critical, glucose_moderate/high/critical,
  oxygen_moderate/high/critical, fever_moderate/high/critical,
  multi_vital, tachycardia, bradycardia, preeclampsia

Labeling: weighted multi-vital scoring with interaction effects
  — NOT simple threshold rules
  — combinations of abnormal vitals score higher than each alone
  — trimester context adjusts BP risk (T3 stricter)
  — late T3 + elevated BP triggers preeclampsia amplifier

50,000 records | 4 classes: Low / Moderate / High / Critical
"""

import numpy as np
import pandas as pd
import os
import json
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score
import joblib

np.random.seed(42)
N = 50_000

# ════════════════════════════════════════════════════════════════
# TRIMESTER-AWARE NORMAL RANGES
# ════════════════════════════════════════════════════════════════
TRIMESTER_BP = {
    1: {"sys": (90, 125),  "dia": (55, 78)},
    2: {"sys": (95, 128),  "dia": (58, 80)},
    3: {"sys": (100, 135), "dia": (60, 85)},
}
TRIMESTER_WEIGHT = {1: (45, 85), 2: (50, 95), 3: (55, 105)}
TRIMESTER_O2     = {1: (95, 100), 2: (95, 100), 3: (93, 100)}


# ════════════════════════════════════════════════════════════════
# WEIGHTED MULTI-VITAL SCORING
# ════════════════════════════════════════════════════════════════
def score_bp(s, d, trimester):
    t3 = 0.3 if trimester == 3 else 0
    if s >= 160 or d >= 110: return 4.0 + t3
    if s >= 140 or d >= 90:  return 3.0 + t3
    if s >= 130 or d >= 80:  return 1.5 + t3
    if s >= 120 or d >= 75:  return 0.5
    return 0.0

def score_hr(hr):
    if hr > 130 or hr < 45:  return 4.0
    if hr > 120 or hr < 50:  return 3.0
    if hr > 100 or hr < 55:  return 1.5
    if hr > 90  or hr < 58:  return 0.5
    return 0.0

def score_o2(o2):
    if o2 < 90:  return 4.0
    if o2 < 92:  return 3.5
    if o2 < 94:  return 2.5
    if o2 < 96:  return 1.0
    return 0.0

def score_glucose(g):
    if g > 13.0 or g < 2.5:  return 4.0
    if g > 11.0 or g < 3.0:  return 3.0
    if g > 8.5  or g < 3.5:  return 2.0
    if g > 7.0  or g < 4.0:  return 1.0
    return 0.0

def score_temp(t):
    if t > 40.0 or t < 35.0:  return 4.0
    if t > 39.5 or t < 35.5:  return 3.0
    if t > 38.5 or t < 36.0:  return 2.0
    if t > 37.8 or t < 36.2:  return 1.0
    return 0.0

def score_weight(w, trimester):
    if trimester == 1:
        if w > 100 or w < 40: return 2.0
        if w > 90  or w < 45: return 1.0
    elif trimester == 2:
        if w > 110 or w < 42: return 2.0
        if w > 100 or w < 47: return 1.0
    else:
        if w > 120 or w < 45: return 2.0
        if w > 110 or w < 50: return 1.0
    return 0.0

def compute_risk_label(row):
    t     = row["trimester"]
    s_bp  = score_bp(row["systolic_bp"], row["diastolic_bp"], t)
    s_hr  = score_hr(row["heart_rate"])
    s_o2  = score_o2(row["oxygen_pct"])
    s_gl  = score_glucose(row["glucose_mmol"])
    s_tp  = score_temp(row["temperature_c"])
    s_wt  = score_weight(row["weight_kg"], t)

    weighted = (
        s_bp * 0.30 + s_o2 * 0.25 + s_gl * 0.18 +
        s_hr * 0.13 + s_tp * 0.09 + s_wt * 0.05
    )

    # Interaction: multiple abnormal vitals amplify risk
    n_abnormal = sum([s_bp > 1.5, s_hr > 1.5, s_o2 > 1.0, s_gl > 1.0, s_tp > 1.0])
    if n_abnormal >= 3:   weighted *= 1.35
    elif n_abnormal == 2: weighted *= 1.15

    # Late T3 preeclampsia amplifier
    if row["pregnancy_week"] >= 35 and s_bp > 1.0:
        weighted *= 1.20

    if weighted >= 1.20:  return 3  # Critical
    if weighted >= 0.70:  return 2  # High
    if weighted >= 0.30:  return 1  # Moderate
    return 0                         # Low


# ════════════════════════════════════════════════════════════════
# PROFILE GENERATORS
# ════════════════════════════════════════════════════════════════
def healthy(week, tri):
    return {
        "systolic_bp":   np.random.randint(*TRIMESTER_BP[tri]["sys"]),
        "diastolic_bp":  np.random.randint(*TRIMESTER_BP[tri]["dia"]),
        "heart_rate":    np.random.randint(58, 95),
        "oxygen_pct":    np.random.randint(*TRIMESTER_O2[tri]),
        "glucose_mmol":  round(np.random.uniform(4.0, 6.8), 1),
        "temperature_c": round(np.random.uniform(36.3, 37.6), 1),
        "weight_kg":     round(np.random.uniform(*TRIMESTER_WEIGHT[tri]), 1),
    }

def bp_profile(week, tri, sev):
    b = healthy(week, tri)
    if sev == "moderate": b["systolic_bp"] = np.random.randint(130,142); b["diastolic_bp"] = np.random.randint(80,92)
    elif sev == "high":   b["systolic_bp"] = np.random.randint(140,162); b["diastolic_bp"] = np.random.randint(90,112)
    else:                 b["systolic_bp"] = np.random.randint(160,220); b["diastolic_bp"] = np.random.randint(110,145)
    return b

def glucose_profile(week, tri, sev):
    b = healthy(week, tri)
    if sev == "moderate": b["glucose_mmol"] = round(np.random.uniform(7.0, 8.5), 1)
    elif sev == "high":   b["glucose_mmol"] = round(np.random.uniform(8.5, 11.0), 1)
    else:                 b["glucose_mmol"] = round(np.random.choice([np.random.uniform(11.0,15.0), np.random.uniform(2.0,3.2)]), 1)
    return b

def oxygen_profile(week, tri, sev):
    b = healthy(week, tri)
    if sev == "moderate": b["oxygen_pct"] = np.random.randint(94, 96)
    elif sev == "high":   b["oxygen_pct"] = np.random.randint(92, 94)
    else:                 b["oxygen_pct"] = np.random.randint(85, 92)
    return b

def fever_profile(week, tri, sev):
    b = healthy(week, tri)
    if sev == "moderate":   b["temperature_c"] = round(np.random.uniform(37.9, 38.5), 1)
    elif sev == "high":     b["temperature_c"] = round(np.random.choice([np.random.uniform(38.5,39.5), np.random.uniform(35.5,36.0)]), 1)
    else:                   b["temperature_c"] = round(np.random.choice([np.random.uniform(39.5,41.0), np.random.uniform(34.0,35.5)]), 1)
    return b

def multi_vital(week, tri):
    b = healthy(week, tri)
    choices = np.random.choice(["bp","hr","o2","glucose","temp"], size=np.random.randint(2,4), replace=False)
    for c in choices:
        lv = np.random.choice(["moderate","high"], p=[0.6,0.4])
        if c == "bp":
            b["systolic_bp"]  = np.random.randint(130,145) if lv=="moderate" else np.random.randint(145,170)
            b["diastolic_bp"] = np.random.randint(80,95)   if lv=="moderate" else np.random.randint(90,110)
        elif c == "hr":    b["heart_rate"]    = int(np.random.choice([np.random.randint(50,58), np.random.randint(100,125)]))
        elif c == "o2":    b["oxygen_pct"]    = np.random.randint(92,96)
        elif c == "glucose": b["glucose_mmol"] = round(np.random.uniform(7.0,11.0),1)
        elif c == "temp":  b["temperature_c"] = round(np.random.uniform(37.9,39.5),1)
    return b

def tachycardia(week, tri):
    b = healthy(week, tri); b["heart_rate"] = np.random.randint(100,145); return b

def bradycardia(week, tri):
    b = healthy(week, tri); b["heart_rate"] = np.random.randint(38,55); return b

def preeclampsia(week):
    b = healthy(week, 3)
    b["systolic_bp"]  = np.random.randint(140,185)
    b["diastolic_bp"] = np.random.randint(90,120)
    b["oxygen_pct"]   = np.random.randint(93,97)
    b["weight_kg"]    = round(np.random.uniform(80,115), 1)
    return b


# ════════════════════════════════════════════════════════════════
# GENERATE
# ════════════════════════════════════════════════════════════════
PROFILE_MIX = [
    ("healthy",          0.22),
    ("bp_moderate",      0.08),
    ("bp_high",          0.07),
    ("bp_critical",      0.05),
    ("glucose_moderate", 0.07),
    ("glucose_high",     0.05),
    ("glucose_critical", 0.03),
    ("oxygen_moderate",  0.05),
    ("oxygen_high",      0.04),
    ("oxygen_critical",  0.03),
    ("fever_moderate",   0.04),
    ("fever_high",       0.03),
    ("fever_critical",   0.02),
    ("multi_vital",      0.10),
    ("tachycardia",      0.04),
    ("bradycardia",      0.03),
    ("preeclampsia",     0.05),
]

print("⏳ Generating 50,000 clinically realistic records...")
rows = []
for name, prop in PROFILE_MIX:
    n = int(N * prop)
    print(f"   {n:>5} rows — {name}")
    for _ in range(n):
        week = np.random.randint(1, 41)
        tri  = 1 if week <= 12 else (2 if week <= 26 else 3)
        if   name == "healthy":          v = healthy(week, tri)
        elif name == "bp_moderate":      v = bp_profile(week, tri, "moderate")
        elif name == "bp_high":          v = bp_profile(week, tri, "high")
        elif name == "bp_critical":      v = bp_profile(week, tri, "critical")
        elif name == "glucose_moderate": v = glucose_profile(week, tri, "moderate")
        elif name == "glucose_high":     v = glucose_profile(week, tri, "high")
        elif name == "glucose_critical": v = glucose_profile(week, tri, "critical")
        elif name == "oxygen_moderate":  v = oxygen_profile(week, tri, "moderate")
        elif name == "oxygen_high":      v = oxygen_profile(week, tri, "high")
        elif name == "oxygen_critical":  v = oxygen_profile(week, tri, "critical")
        elif name == "fever_moderate":   v = fever_profile(week, tri, "moderate")
        elif name == "fever_high":       v = fever_profile(week, tri, "high")
        elif name == "fever_critical":   v = fever_profile(week, tri, "critical")
        elif name == "multi_vital":      v = multi_vital(week, tri)
        elif name == "tachycardia":      v = tachycardia(week, tri)
        elif name == "bradycardia":      v = bradycardia(week, tri)
        elif name == "preeclampsia":
            week = np.random.randint(28, 41); tri = 3
            v = preeclampsia(week)
        rows.append({**v, "pregnancy_week": week, "trimester": tri})

# fill remainder
for _ in range(N - len(rows)):
    week = np.random.randint(1, 41); tri = 1 if week<=12 else (2 if week<=26 else 3)
    rows.append({**healthy(week, tri), "pregnancy_week": week, "trimester": tri})

df = pd.DataFrame(rows)
print("\n⏳ Labeling with weighted multi-vital scoring + interaction effects...")
df["risk_level"] = df.apply(compute_risk_label, axis=1)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

print(f"\n✅ Dataset: {df.shape}")
label_names = {0:"Low", 1:"Moderate", 2:"High", 3:"Critical"}
for k, v in df["risk_level"].value_counts().sort_index().items():
    print(f"   {label_names[k]:>10}: {v:>6}  ({v/N*100:.1f}%)")

os.makedirs("data", exist_ok=True)
df.to_csv("data/mamaai_vitals_dataset.csv", index=False)
print(f"\n✅ Saved -> data/mamaai_vitals_dataset.csv")


# ════════════════════════════════════════════════════════════════
# TRAIN
# ════════════════════════════════════════════════════════════════
FEATURES = [
    "systolic_bp", "diastolic_bp", "heart_rate", "oxygen_pct",
    "glucose_mmol", "temperature_c", "weight_kg",
    "pregnancy_week", "trimester",
]
X = df[FEATURES]
y = df["risk_level"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\nTrain: {len(X_train)} | Test: {len(X_test)}")

print("\n⏳ Training Random Forest...")
rf = RandomForestClassifier(
    n_estimators=300, max_depth=None,
    class_weight="balanced", n_jobs=-1, random_state=42,
)
rf.fit(X_train, y_train)
rf_acc = accuracy_score(y_test, rf.predict(X_test))

print("⏳ Training Gradient Boosting...")
gb = GradientBoostingClassifier(
    n_estimators=200, max_depth=5,
    learning_rate=0.1, random_state=42,
)
gb.fit(X_train, y_train)
gb_acc = accuracy_score(y_test, gb.predict(X_test))

print(f"\n{'='*50}")
print(f"Random Forest  : {rf_acc*100:.2f}%")
print(classification_report(y_test, rf.predict(X_test),
      target_names=["Low","Moderate","High","Critical"]))

print(f"{'='*50}")
print(f"Gradient Boost : {gb_acc*100:.2f}%")
print(classification_report(y_test, gb.predict(X_test),
      target_names=["Low","Moderate","High","Critical"]))

best       = gb if gb_acc > rf_acc else rf
best_name  = "Gradient Boosting" if gb_acc > rf_acc else "Random Forest"
best_acc   = max(gb_acc, rf_acc)
print(f"\n🏆 Best: {best_name}  ({best_acc*100:.2f}%)")

print("\nFeature importances:")
for feat, imp in sorted(zip(FEATURES, best.feature_importances_), key=lambda x:x[1], reverse=True):
    print(f"  {feat:<20} {imp:.4f}  {'█'*int(imp*40)}")

os.makedirs("model", exist_ok=True)
joblib.dump(best, "model/vitals_model.pkl")

metadata = {
    "features":    FEATURES,
    "label_names": {str(k):v for k,v in label_names.items()},
    "model_type":  best_name,
    "accuracy":    round(best_acc, 4),
    "n_train":     len(X_train),
    "dataset":     "MAMAAI custom synthetic dataset — 17 clinical profiles, weighted multi-vital scoring",
}
with open("model/model_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print(f"\n✅ Model    -> model/vitals_model.pkl")
print(f"✅ Metadata -> model/model_metadata.json")
