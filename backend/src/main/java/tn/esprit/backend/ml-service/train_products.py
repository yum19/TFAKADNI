"""
train.py  –  Product Recommendation ML Model
=============================================
Reads from:
  • pregnancies  (lmp_date, due_date, pregnancy_type, status, hospital_name)
  • babies       (gender, birthDate, mother_id)
  • produits     (id, nom, description, prix, stock)
  • categories   (name)
  • commande_items + commandes  → past purchases (labels)

Feature engineering:
  • pregnancy_week       → trimester (1/2/3)
  • baby_age_months      → infant / toddler
  • pregnancy_type       → singleton / twin
  • category             → one-hot encoded
  • price_bucket         → cheap / mid / premium
  • user purchased it before (bool)
  • stock availability (bool)

Label: 1 if user bought or interacted, 0 otherwise
Model: GradientBoostingClassifier → predict purchase probability
"""

import mysql.connector
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.pipeline import Pipeline
import joblib, os, json
from datetime import date

# ── DB config ────────────────────────────────────────────────────────────────
DB = dict(host="localhost", user="root", password="", database="mamaai-integration-1-7-3-6")

MODEL_PATH   = "rec_model.pkl"
META_PATH    = "rec_meta.json"   # stores category list, encoders, etc.

# ─────────────────────────────────────────────────────────────────────────────
def load_data():
    conn = mysql.connector.connect(**DB)

    # 1. All active users with pregnancies
    pregnancies = pd.read_sql("""
                              SELECT
                                  p.user_id,
                                  TIMESTAMPDIFF(WEEK, p.lmp_date, CURDATE())   AS preg_week,
                                  p.pregnancy_type,
                                  p.status                                       AS preg_status,
                                  p.hospital_name
                              FROM pregnancies p
                              WHERE p.status IN ('ACTIVE','COMPLETED')
                              """, conn)

    # 2. Babies (one row per baby; we'll aggregate per user)
    babies = pd.read_sql("""
                         SELECT
                             b.mother_id                                          AS user_id,
                             TIMESTAMPDIFF(MONTH, b.birthDate, CURDATE())        AS baby_age_months,
                             b.gender
                         FROM babies b
                         """, conn)

    # Aggregate babies per user: youngest baby age, count, has_girl, has_boy
    baby_agg = babies.groupby("user_id").agg(
        baby_count      = ("baby_age_months", "count"),
        min_baby_age    = ("baby_age_months", "min"),   # youngest
        has_girl        = ("gender", lambda x: int("FEMALE" in x.values or "F" in x.values)),
        has_boy         = ("gender", lambda x: int("MALE"   in x.values or "M" in x.values)),
    ).reset_index()

    # 3. Products with category
    products = pd.read_sql("""
                           SELECT
                               pr.id          AS product_id,
                               pr.nom,
                               pr.description,
                               pr.prix,
                               pr.stock,
                               c.nom          AS category
                           FROM produits pr
                                    LEFT JOIN categories c ON c.id = pr.categorie_id
                           """, conn)

    # 4. Past purchases (positive labels)
    purchases = pd.read_sql("""
                            SELECT DISTINCT
                                co.user_id,
                                ci.produit_id  AS product_id,
                                1              AS purchased
                            FROM commande_items ci
                                     JOIN commandes co ON co.id = ci.commande_id
                            """, conn)

    conn.close()
    return pregnancies, baby_agg, products, purchases


def build_features(pregnancies, baby_agg, products, purchases):
    """
    Cross-join every user × product, compute features, label = purchased.
    """
    # Merge user profile
    user_profile = pregnancies.merge(baby_agg, on="user_id", how="left")
    user_profile["baby_count"]   = user_profile["baby_count"].fillna(0).astype(int)
    user_profile["min_baby_age"] = user_profile["min_baby_age"].fillna(-1)
    user_profile["has_girl"]     = user_profile["has_girl"].fillna(0).astype(int)
    user_profile["has_boy"]      = user_profile["has_boy"].fillna(0).astype(int)

    # Derived pregnancy features
    user_profile["trimester"] = user_profile["preg_week"].apply(
        lambda w: 1 if w < 14 else (2 if w < 28 else 3) if w >= 0 else 0
    )
    user_profile["is_twin"] = (
        user_profile["pregnancy_type"].str.upper().str.contains("TWIN|GEMELL", na=False)
    ).astype(int)

    # Cross-join (user × product)
    user_profile["_key"] = 1
    products["_key"]     = 1
    df = user_profile.merge(products, on="_key").drop("_key", axis=1)

    # Attach label
    df = df.merge(purchases, on=["user_id", "product_id"], how="left")
    df["purchased"] = df["purchased"].fillna(0).astype(int)

    # ── Engineered features ──────────────────────────────────────────────────
    df["has_stock"]     = (df["stock"] > 0).astype(int)
    df["price_bucket"]  = pd.cut(df["prix"],
                                 bins=[0, 30, 100, 9999],
                                 labels=[0, 1, 2]).astype(float)

    # Pregnancy–category relevance (domain knowledge encoded as rules)
    df["cat_lower"] = df["category"].str.lower().fillna("")

    def relevance(row):
        score = 0.0
        cat = row["cat_lower"]
        # Maternity / pregnancy products → boost in T1/T2/T3
        if any(k in cat for k in ["maternit","grossesse","pregnancy","prenatal","prénatal"]):
            score += 2.0 if row["preg_status"] == "ACTIVE" else 0.5
        # Baby products → boost if user has a young baby
        if any(k in cat for k in ["bébé","bebe","baby","infant","nourrisson"]):
            age = row["min_baby_age"]
            if 0 <= age <= 12:   score += 2.5
            elif 12 < age <= 36: score += 1.5
            elif age > 36:       score += 0.5
        # Twins → double boost for twin packs
        if row["is_twin"] and any(k in cat for k in ["twin","jumeau","double"]):
            score += 1.5
        # Gender-specific
        if row["has_girl"] and any(k in cat for k in ["fille","girl","rose","pink"]):
            score += 1.0
        if row["has_boy"] and any(k in cat for k in ["garçon","boy","bleu","blue"]):
            score += 1.0
        # Trimester-specific
        if row["trimester"] == 1 and any(k in cat for k in ["nausée","nausee","vitamine"]):
            score += 1.2
        if row["trimester"] == 3 and any(k in cat for k in ["accouchement","layette","naissance"]):
            score += 1.5
        return score

    df["domain_score"] = df.apply(relevance, axis=1)

    # Encode category as integer
    le = LabelEncoder()
    df["cat_encoded"] = le.fit_transform(df["category"].fillna("unknown"))

    return df, le


FEATURES = [
    "trimester", "is_twin", "baby_count", "min_baby_age",
    "has_girl", "has_boy", "has_stock", "price_bucket",
    "domain_score", "cat_encoded", "prix"
]


def train():
    print("📦  Loading data from DB …")
    pregnancies, baby_agg, products, purchases = load_data()

    print(f"   Users: {pregnancies['user_id'].nunique()}  |  "
          f"Products: {len(products)}  |  "
          f"Purchases: {len(purchases)}")

    df, le = build_features(pregnancies, baby_agg, products, purchases)

    positive = df["purchased"].sum()
    print(f"   Positive samples: {positive} / {len(df)}")

    if positive < 5:
        print("⚠️  Not enough purchase data — generating synthetic labels …")
        df = _add_synthetic_labels(df)

    X = df[FEATURES].fillna(0).astype(float)
    y = df["purchased"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    model = GradientBoostingClassifier(
        n_estimators=200,
        learning_rate=0.08,
        max_depth=5,
        min_samples_leaf=4,
        subsample=0.8,
        random_state=42
    )
    model.fit(X_train, y_train)

    y_prob = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_prob)
    print(f"\n✅  AUC-ROC: {auc:.3f}")
    print(classification_report(y_test, model.predict(X_test)))

    print("\n📊  Feature importances:")
    for name, imp in sorted(zip(FEATURES, model.feature_importances_),
                            key=lambda x: -x[1]):
        print(f"   {name:20s}: {imp:.4f}")

    # Save model + metadata
    joblib.dump(model, MODEL_PATH)

    categories = le.classes_.tolist()
    meta = {
        "features": FEATURES,
        "categories": categories,
        "label_encoder_classes": categories
    }
    with open(META_PATH, "w") as f:
        json.dump(meta, f)

    print(f"\n💾  Saved {MODEL_PATH} and {META_PATH}")


def _add_synthetic_labels(df: pd.DataFrame) -> pd.DataFrame:
    """
    When purchase history is thin, use domain_score as a proxy label.
    Products with high domain relevance are marked as 'purchased' (simulated).
    """
    threshold = df["domain_score"].quantile(0.70)
    df["purchased"] = (df["domain_score"] >= threshold).astype(int)
    print(f"   Synthetic positive samples: {df['purchased'].sum()}")
    return df


if __name__ == "__main__":
    train()
