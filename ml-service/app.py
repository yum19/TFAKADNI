from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle, json
import numpy as np

app = Flask(__name__)
CORS(app)

with open('model.pkl','rb')    as f: model    = pickle.load(f)
with open('encoders.pkl','rb') as f: encoders = pickle.load(f)
with open('model_meta.json')   as f: meta     = json.load(f)

RISK_INFO = {
    'FAIBLE': {
        'label': 'Risque Faible',
        'emoji': '🟢',
        'color': '#10b981',
        'message': 'Votre profil ne présente pas de facteurs de risque majeurs. Continuez vos consultations régulières.',
        'advice': ['Suivi mensuel standard recommandé',
                   'Maintenir une alimentation équilibrée',
                   'Activité physique douce (marche, yoga prénatal)',
                   'Éviter le stress excessif']
    },
    'MOYEN': {
        'label': 'Risque Modéré',
        'emoji': '🟡',
        'color': '#f59e0b',
        'message': 'Votre profil présente quelques facteurs à surveiller. Un suivi médical renforcé est conseillé.',
        'advice': ['Consultations bimensuelles recommandées',
                   'Surveiller la prise de poids régulièrement',
                   'Contrôle de la glycémie si antécédent de diabète',
                   'Mesure de tension artérielle régulière']
    },
    'ELEVE': {
        'label': 'Risque Élevé',
        'emoji': '🔴',
        'color': '#ef4444',
        'message': 'Votre profil nécessite une attention médicale particulière. Consultez votre médecin rapidement.',
        'advice': ['Suivi hebdomadaire avec spécialiste recommandé',
                   'Hospitalisation préventive possible',
                   'Monitoring fœtal régulier',
                   'Consultation en urgence si symptômes inhabituels']
    }
}

def get_risk_factors(age, bmi, blood_type, med):
    factors = []
    if age > 35:      factors.append(f'Âge maternel avancé ({age} ans) — risque accru')
    if age < 18:      factors.append(f'Grossesse adolescente ({age} ans)')
    if bmi > 35:      factors.append(f'Obésité sévère (IMC {bmi:.1f})')
    elif bmi > 30:    factors.append(f'Obésité (IMC {bmi:.1f})')
    elif bmi > 25:    factors.append(f'Surpoids (IMC {bmi:.1f})')
    elif bmi < 18.5:  factors.append(f'Insuffisance pondérale (IMC {bmi:.1f})')
    if 'diabete'      in med: factors.append('Diabète — risque de diabète gestationnel')
    if 'hypertension' in med: factors.append('Hypertension — risque de prééclampsie')
    if blood_type.endswith('NEG'): factors.append('Rhésus négatif — injection anti-D requise')
    return factors or ['Aucun facteur de risque majeur détecté ✅']

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status':'OK','model':meta.get('model_type'),
                    'accuracy':meta['accuracy'],'target':meta.get('target'),'version':'3.0.0'})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        d = request.get_json()
        required = ['age','weight_kg','height_cm','blood_type','medical_history']
        for field in required:
            if field not in d:
                return jsonify({'error': f'Champ manquant : {field}'}), 400

        age        = int(d['age'])
        weight_kg  = float(d['weight_kg'])
        height_cm  = float(d['height_cm'])
        bmi        = round(weight_kg/((height_cm/100)**2), 2)
        blood_type = str(d['blood_type']).upper().replace('-','_')
        med        = str(d['medical_history']).lower()

        has_diab = 1 if 'diabete'      in med else 0
        has_hype = 1 if 'hypertension' in med else 0
        rh_neg   = 1 if blood_type.endswith('NEG') else 0
        age_grp  = 0 if age<20 else (1 if age<28 else (2 if age<35 else 3))
        bmi_cat  = 0 if bmi<18.5 else (1 if bmi<25 else (2 if bmi<30 else 3))

        try: blood_enc = encoders['blood_type'].transform([blood_type])[0]
        except: blood_enc = 0
        try: med_enc   = encoders['medical_history'].transform([med])[0]
        except: med_enc = 0

        X = np.array([[age, weight_kg, height_cm, bmi,
                        has_diab, has_hype, rh_neg,
                        age_grp, bmi_cat,
                        blood_enc, med_enc]])

        risk       = model.predict(X)[0]
        print(f"[DEBUG] Input: age={age}, bmi={bmi}, blood={blood_type}, med={med}, has_d={has_diab}, has_h={has_hype}")
        probas     = model.predict_proba(X)[0]
        confidence = float(max(probas))
        proba_dict = {c:round(float(p),4) for c,p in zip(model.classes_, probas)}
        info       = RISK_INFO.get(risk, {})

        return jsonify({
            'success':True, 'risk':risk,
            'risk_label':info.get('label',risk),
            'emoji':info.get('emoji','🟡'),
            'color':info.get('color','#f59e0b'),
            'confidence':round(confidence*100,1),
            'message':info.get('message',''),
            'advice':info.get('advice',[]),
            'probabilities':proba_dict,
            'risk_factors':get_risk_factors(age,bmi,blood_type,med),
            'bmi':bmi,
            'bmi_status':'Normal' if 18.5<=bmi<25 else('Surpoids' if bmi<30 else 'Obésité')
        })
    except Exception as e:
        return jsonify({'error':str(e)}), 500

if __name__ == '__main__':
    print("🚀 MAMAAI Risk Predictor API — http://localhost:5000")
    print(f"📊 Précision : {meta['accuracy']*100:.1f}%")
    app.run(debug=True, host='0.0.0.0', port=5000)
