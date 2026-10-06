import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier, VotingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import pickle
import json

np.random.seed(42)

def generate_dataset(N=12000):
    data = []
    blood_types = ['A_POS','A_NEG','B_POS','B_NEG','AB_POS','AB_NEG','O_POS','O_NEG']
    meds = ['aucun','diabete','hypertension','diabete_hypertension']

    def row(risk, age_r, bmi_r, med_p):
        age  = np.random.randint(*age_r)
        h    = np.random.randint(150, 182)
        bmi  = np.random.uniform(*bmi_r)
        w    = round(bmi * ((h/100)**2), 1)
        bt   = np.random.choice(blood_types)
        med  = np.random.choice(meds, p=med_p)
        has_diab = 1 if 'diabete'      in med else 0
        has_hype = 1 if 'hypertension' in med else 0
        rh_neg   = 1 if bt.endswith('NEG') else 0
        age_grp  = 0 if age<20 else (1 if age<28 else (2 if age<35 else 3))
        bmi_cat  = 0 if bmi<18.5 else (1 if bmi<25 else (2 if bmi<30 else 3))
        data.append({
            'age':age, 'weight_kg':w, 'height_cm':h, 'bmi':round(bmi,2),
            'has_diabetes':has_diab, 'has_hypertension':has_hype,
            'rh_negative':rh_neg, 'age_group':age_grp, 'bmi_category':bmi_cat,
            'blood_type':bt, 'medical_history':med, 'risk':risk
        })

    # FAIBLE — jeunes, IMC normal, sans antécédents
    for _ in range(4500):
        row('FAIBLE', (15,30), (17.5,24.9), [0.90,0.05,0.04,0.01])

    # MOYEN — âge moyen, surpoids, un antécédent
    for _ in range(4000):
        row('MOYEN',  (28,38), (22.0,30.0), [0.50,0.25,0.20,0.05])

    # ÉLEVÉ — âge avancé, obésité, antécédents multiples
    for _ in range(3500):
        row('ELEVE',  (35,46), (27.0,42.0), [0.20,0.35,0.25,0.20])

    return pd.DataFrame(data)

def train():
    print("🔄 Génération du dataset — Risque de Complication Grossesse...")
    df = generate_dataset()
    df.to_csv('dataset.csv', index=False)
    print(f"✅ {len(df)} lignes\n{df['risk'].value_counts()}\n")

    le_blood   = LabelEncoder()
    le_medical = LabelEncoder()
    df['blood_type_enc']      = le_blood.fit_transform(df['blood_type'])
    df['medical_history_enc'] = le_medical.fit_transform(df['medical_history'])

    features = [
        'age','weight_kg','height_cm','bmi',
        'has_diabetes','has_hypertension','rh_negative',
        'age_group','bmi_category',
        'blood_type_enc','medical_history_enc'
    ]
    X = df[features]
    y = df['risk']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)

    print("🤖 Gradient Boosting...")
    gb = GradientBoostingClassifier(n_estimators=300, learning_rate=0.1, max_depth=8, random_state=42)
    gb.fit(X_train, y_train)

    print("🌲 Random Forest...")
    rf = RandomForestClassifier(n_estimators=300, max_depth=20, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)

    print("🗳️  Voting Classifier...")
    voting = VotingClassifier(estimators=[('gb',gb),('rf',rf)], voting='soft')
    voting.fit(X_train, y_train)

    y_pred = voting.predict(X_test)
    acc    = accuracy_score(y_test, y_pred)

    print(f"\n{'='*50}")
    print(f"🎯 Précision : {acc*100:.2f}%")
    print(f"{'='*50}")
    print(classification_report(y_test, y_pred))

    cv = cross_val_score(voting, X, y, cv=5)
    print(f"📊 Cross-val: {cv.mean()*100:.2f}% ± {cv.std()*100:.2f}%")

    print("\n📈 Feature importances:")
    for f,i in sorted(zip(features, rf.feature_importances_), key=lambda x:-x[1]):
        print(f"  {f:25s} {'█'*int(i*60)} {i:.4f}")

    with open('model.pkl','wb')    as f: pickle.dump(voting, f)
    with open('encoders.pkl','wb') as f:
        pickle.dump({'blood_type':le_blood,'medical_history':le_medical}, f)
    with open('model_meta.json','w') as f:
        json.dump({'features':features,'classes':list(voting.classes_),
                   'accuracy':round(acc,4),'cv_mean':round(cv.mean(),4),
                   'model_type':'VotingClassifier(GB+RF)',
                   'target':'risk_complication','n_samples':len(df)}, f, indent=2)

    print(f"\n🏆 Précision : {acc*100:.2f}%")

if __name__ == '__main__':
    train()
