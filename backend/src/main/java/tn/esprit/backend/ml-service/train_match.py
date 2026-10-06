"""
train_match.py  –  Marrainage / Mentorship Match ML Model
==========================================================
Reads from:
  • match_ratings  (stars label)
  • mentorship_matches
  • pregnancies, babies, posts

Trains a RandomForestRegressor to predict match quality (1–5 stars).
Saves to model.pkl (loaded by app.py as match_model).
"""

import mysql.connector
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib

DB = dict(host="localhost", user="root", password="", database="mamaai-integration-1-7-3-6")


def load_data():
    conn = mysql.connector.connect(**DB)
    query = """
            SELECT
                mr.stars                                              AS label,
                ABS(TIMESTAMPDIFF(WEEK, pa.lmp_date, pb.lmp_date))   AS week_delta,
                (pa.hospital_name = pb.hospital_name)                 AS same_city,
                (pa.pregnancy_type = pb.pregnancy_type)               AS same_type,
                COALESCE(ba.cnt, 0)                                   AS mother_babies,
                COALESCE(bb.cnt, 0)                                   AS marraine_babies,
                (pa.pregnancy_type = 'GEMELLAIRE')                    AS is_twin_mother,
                (pb.pregnancy_type = 'GEMELLAIRE')                    AS is_twin_marraine,
                COALESCE(ua.post_count, 0)                            AS mother_posts,
                COALESCE(ub.post_count, 0)                            AS marraine_posts
            FROM match_ratings mr
                     JOIN mentorship_matches mm ON mm.id = mr.match_id
                     JOIN pregnancies pa ON pa.user_id = mm.user_a_id AND pa.status = 'ACTIVE'
                     JOIN pregnancies pb ON pb.user_id = mm.user_b_id AND pb.status = 'ACTIVE'
                     LEFT JOIN (SELECT mother_id, COUNT(*) cnt FROM babies GROUP BY mother_id) ba
                               ON ba.mother_id = mm.user_a_id
                     LEFT JOIN (SELECT mother_id, COUNT(*) cnt FROM babies GROUP BY mother_id) bb
                               ON bb.mother_id = mm.user_b_id
                     LEFT JOIN (SELECT user_id, COUNT(*) post_count FROM posts GROUP BY user_id) ua
                               ON ua.user_id = mm.user_a_id
                     LEFT JOIN (SELECT user_id, COUNT(*) post_count FROM posts GROUP BY user_id) ub
                               ON ub.user_id = mm.user_b_id \
            """
    df = pd.read_sql(query, conn)
    conn.close()
    return df


def _synthetic_data(n=500):
    """Fallback synthetic training set when real ratings are scarce."""
    rng = np.random.default_rng(0)
    rows = []
    for _ in range(n):
        same_city  = rng.integers(0, 2)
        week_delta = rng.integers(0, 20)
        same_type  = rng.integers(0, 2)
        mb = rng.integers(0, 3)
        rb = rng.integers(0, 3)
        twin_m = rng.integers(0, 2)
        twin_r = rng.integers(0, 2)
        mp = rng.integers(0, 50)
        rp = rng.integers(0, 50)

        score  = same_city * 1.5
        score += max(0, 1.0 - week_delta * 0.05)
        score += same_type * 1.0
        score += min(rb, 2) * 0.5
        score += (twin_m == twin_r) * 0.5
        score += rng.normal(0, 0.4)
        label  = float(np.clip(np.round(score + 1), 1, 5))
        rows.append([label, week_delta, same_city, same_type, mb, rb,
                     twin_m, twin_r, mp, rp])

    cols = ["label","week_delta","same_city","same_type","mother_babies",
            "marraine_babies","is_twin_mother","is_twin_marraine",
            "mother_posts","marraine_posts"]
    return pd.DataFrame(rows, columns=cols)


def train():
    print("[match] Loading data …")
    df = load_data()

    if len(df) < 10:
        print("[match] Not enough real ratings — using synthetic data.")
        df = _synthetic_data(500)

    X = df.drop("label", axis=1).astype(float)
    y = df["label"].astype(float)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=200, max_depth=8, min_samples_leaf=3, random_state=42
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    print(f"[match] MAE: {mean_absolute_error(y_test, preds):.3f} stars")
    print("[match] Feature importances:")
    for name, imp in zip(X.columns, model.feature_importances_):
        print(f"  {name}: {imp:.3f}")

    joblib.dump(model, "model.pkl")
    print("[match] Saved model.pkl")


if __name__ == "__main__":
    train()