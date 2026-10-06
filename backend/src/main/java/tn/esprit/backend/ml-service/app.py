"""
app.py  –  Unified ML Flask API  (port 5000)
=============================================
FIX: /detect-fake-info now returns "isFakeInfo" (not "isFake") so Angular
     postFakeInfoMap renders correctly.
"""

from flask import Flask, request, jsonify
import joblib, numpy as np, os, subprocess, json, threading, warnings, re
import pandas as pd
import requests as http_requests
import io
from PIL import Image
warnings.filterwarnings("ignore", category=UserWarning)

from train_harmful_posts import (
    HARMFUL_MODEL_PATH, HARMFUL_CATEGORIES, CATEGORY_KEYWORDS,
    HIGH_SEVERITY, MEDIUM_SEVERITY,
    train as train_harmful,
)
from train_fake_info import (
    FAKE_INFO_MODEL_PATH, FAKE_INFO_CATEGORIES, FAKE_INFO_KEYWORDS,
    ML_ONLY_THRESHOLD, KEYWORD_THRESHOLD, MIN_WORD_COUNT, FALLBACK_THRESHOLD,
    train as train_fake_info,
)

app = Flask(__name__)

MATCH_MODEL_PATH = "model.pkl"
REC_MODEL_PATH   = "rec_model.pkl"
REC_META_PATH    = "rec_meta.json"
SUMMARY_MODEL_PATH = "summary_model.pkl"

MATCH_FEATURES = [
    "week_delta","same_city","same_type","mother_babies","marraine_babies",
    "is_twin_mother","is_twin_marraine","mother_posts","marraine_posts"
]
REC_FEATURES = [
    "trimester","is_twin","baby_count","min_baby_age","has_girl","has_boy",
    "has_stock","price_bucket","domain_score","cat_encoded","prix"
]

HARMFUL_THRESHOLD = 0.55
HARMFUL_MIN_WORDS = 5
GORE_THRESHOLD    = 0.15
IMAGE_TIMEOUT     = 8
MAX_IMAGE_DIM     = 512
MAX_IMAGES_PER_POST = 4


# =============================================================================
#  Model loading
# =============================================================================

def _load_match_model():
    if not os.path.exists(MATCH_MODEL_PATH):
        subprocess.run(["python", "train_match.py"], check=True)
    return joblib.load(MATCH_MODEL_PATH)

def _load_rec_model():
    if not os.path.exists(REC_MODEL_PATH):
        subprocess.run(["python", "train_products.py"], check=True)
    return joblib.load(REC_MODEL_PATH)

def _load_rec_meta():
    if os.path.exists(REC_META_PATH):
        with open(REC_META_PATH) as f:
            return json.load(f)
    return {"categories": [], "label_encoder_classes": []}

def _load_harmful_model():
    if not os.path.exists(HARMFUL_MODEL_PATH):
        train_harmful()
    return joblib.load(HARMFUL_MODEL_PATH)

def _load_fake_info_model():
    if not os.path.exists(FAKE_INFO_MODEL_PATH):
        train_fake_info()
    return joblib.load(FAKE_INFO_MODEL_PATH)

def _load_summary_model():
    if not os.path.exists(SUMMARY_MODEL_PATH):
        from train_summary import train as train_summary_model
        train_summary_model()
    return joblib.load(SUMMARY_MODEL_PATH)

match_model     = _load_match_model()
rec_model       = _load_rec_model()
rec_meta        = _load_rec_meta()
harmful_model   = _load_harmful_model()
fake_info_model = _load_fake_info_model()
summary_model   = _load_summary_model()


# =============================================================================
#  IMAGE ANALYSIS
# =============================================================================

def _blood_red_score(img_rgb) -> float:
    R = img_rgb[:, :, 0].astype(float)
    G = img_rgb[:, :, 1].astype(float)
    B = img_rgb[:, :, 2].astype(float)
    total = R.size

    is_black      = (R < 30) & (G < 30) & (B < 30)
    is_near_white = (R > 215) & (G > 205) & (B > 205)
    is_pink_bg    = (R > 200) & (G > 130) & (B > 130) & ((R - G) < 80) & ((R - B) < 80)
    content_mask  = ~(is_black | is_near_white | is_pink_bg)
    content_count = int(content_mask.sum())

    if content_count < total * 0.05:
        Rf, Gf, Bf, n = R.flatten(), G.flatten(), B.flatten(), total
    else:
        Rf, Gf, Bf, n = R[content_mask], G[content_mask], B[content_mask], content_count

    blood_mask  = (Rf > 110) & (Rf > 1.6 * Gf) & (Rf > 1.6 * Bf) & (Gf < 110) & (Bf < 110)
    bright_mask = (Rf > 150) & (Gf < 70) & (Bf < 70)
    return float(min(0.6 * (blood_mask.sum() / n) + 0.4 * (bright_mask.sum() / n), 1.0))

def _analyse_image_url(image_url: str) -> dict:
    import base64
    try:
        if image_url.startswith("data:"):
            try:
                _header, b64data = image_url.split(",", 1)
            except ValueError:
                return {"isHarmful": False, "label": "unavailable", "score": 0.0}
            img = Image.open(io.BytesIO(base64.b64decode(b64data))).convert("RGB")
        else:
            resp = http_requests.get(image_url, timeout=IMAGE_TIMEOUT, stream=True)
            if resp.status_code != 200:
                return {"isHarmful": False, "label": "unavailable", "score": 0.0}
            img = Image.open(io.BytesIO(resp.content)).convert("RGB")

        img.thumbnail((MAX_IMAGE_DIM, MAX_IMAGE_DIM), Image.LANCZOS)
        score      = _blood_red_score(np.array(img))
        is_harmful = score > GORE_THRESHOLD
        return {"isHarmful": is_harmful, "label": "gore_blood" if is_harmful else "normal", "score": round(score, 3)}
    except Exception as e:
        print(f"[image] Error: {e}")
        return {"isHarmful": False, "label": "unavailable", "score": 0.0}

def _analyse_images(image_urls: list) -> dict:
    if not image_urls:
        return {"hasHarmfulImage": False, "imageResults": []}
    results = []
    for url in image_urls[:MAX_IMAGES_PER_POST]:
        r = _analyse_image_url(url)
        r["url"] = url
        results.append(r)
    return {"hasHarmfulImage": any(r["isHarmful"] for r in results), "imageResults": results}


# =============================================================================
#  HARMFUL CONTENT DETECTION
# =============================================================================

KEYWORD_FLAG_THRESHOLD = 0.70  # same as training

def _keyword_fallback(text: str):
    text_lower = text.lower()
    best_category = None
    best_score = 0.0

    for category, patterns in CATEGORY_KEYWORDS.items():
        category_score = 0.0

        for pattern, weight in patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                # keep highest weight match for that category
                category_score = max(category_score, weight)

        if category_score > best_score:
            best_score = category_score
            best_category = category

    # Only trigger if strong enough
    if best_score >= KEYWORD_FLAG_THRESHOLD:
        return best_category, best_score

    return None, 0.0

def _build_harmful_response(text: str, models: dict, image_result: dict = None) -> dict:
    SAFE = {
        "isHarmful": False, "severity": "NONE", "category": "SAFE",
        "categoryLabel": "Safe content", "confidence": 99.0,
        "warningMessage": None, "blurMessage": None, "shouldBlur": False,
        "imageAnalysis": image_result,
    }

    if len(text.split()) < HARMFUL_MIN_WORDS:
        if image_result and image_result.get("hasHarmfulImage"):
            return {**SAFE, "isHarmful": True, "severity": "HIGH",
                    "category": "MEDICAL_EMERGENCY", "confidence": 80.0,
                    "warningMessage": "⚠️ This image may contain graphic content.",
                    "blurMessage": "⚠️ This post contains potentially distressing imagery.",
                    "shouldBlur": True}
        return SAFE

    binary_proba = models["binary"].predict_proba([text])[0]
    harmful_prob = float(binary_proba[1])
    kw_category, kw_score = _keyword_fallback(text)

    if kw_category:
        detected_category = kw_category
        cat_confidence    = max(harmful_prob, kw_score)
        is_harmful        = True
    else:
        if harmful_prob < HARMFUL_THRESHOLD:
            if image_result and image_result.get("hasHarmfulImage"):
                detected_category = "MEDICAL_EMERGENCY"
                cat_confidence    = 0.80
                is_harmful        = True
            else:
                return SAFE
        else:
            multi_pred    = models["multi"].predict([text])[0]
            multi_proba   = models["multi"].predict_proba([text])[0]
            multi_classes = models["multi"].classes_.tolist()
            cat_idx       = multi_classes.index(multi_pred) if multi_pred in multi_classes else 0
            cat_confidence    = float(multi_proba[cat_idx])
            detected_category = multi_pred if multi_pred != "SAFE" else "MEDICAL_EMERGENCY"
            is_harmful        = True

    severity       = "HIGH" if detected_category in HIGH_SEVERITY else ("MEDIUM" if detected_category in MEDIUM_SEVERITY else "LOW")
    category_label = HARMFUL_CATEGORIES.get(detected_category, "Medical concern")

    warning_messages = {
        "BLEEDING":          "⚠️ It looks like you're describing active bleeding. Please contact a doctor or call emergency services immediately.",
        "SEVERE_PAIN":       "⚠️ Severe pain during pregnancy is a medical emergency. Please seek immediate medical attention.",
        "PREECLAMPSIA":      "⚠️ The symptoms you describe may indicate preeclampsia. Please consult a doctor urgently.",
        "ECTOPIC":           "⚠️ Signs of ectopic pregnancy require emergency medical care. Please call emergency services now.",
        "MEDICAL_EMERGENCY": "⚠️ This sounds like a medical emergency. Please call emergency services immediately.",
        "SELF_HARM":         "⚠️ Your wellbeing matters deeply. Please reach out to a mental health professional or crisis helpline right away.",
        "PRETERM_LABOR":     "⚠️ Signs of preterm labor require immediate medical attention. Please go to hospital now.",
        "MISCARRIAGE":       "💙 We're so sorry for your loss. If you're experiencing physical symptoms, please see a doctor.",
        "BABY_LOSS":         "💙 We're deeply sorry for your loss. Grief support resources are available whenever you're ready.",
        "STILLBIRTH":        "💙 We're so sorry. Please reach out to your healthcare provider and grief support services.",
        "POSTPARTUM_CRISIS": "⚠️ Postpartum mental health crises require immediate support. Please contact a healthcare provider or crisis line now.",
        "SUBSTANCE_ABUSE":   "💙 If you need support with substance use during pregnancy, confidential help is available.",
    }
    blur_messages = {
        "HIGH":   "⚠️ This post contains content related to a medical emergency or crisis situation.",
        "MEDIUM": "💙 This post discusses sensitive topics such as pregnancy loss or postpartum struggles.",
        "LOW":    "ℹ️ This post touches on a sensitive health topic.",
    }
    return {
        "isHarmful": True, "severity": severity, "category": detected_category,
        "categoryLabel": category_label, "confidence": round(cat_confidence * 100, 1),
        "warningMessage": warning_messages.get(detected_category, "⚠️ Please consult a healthcare professional if you need immediate help."),
        "blurMessage": blur_messages[severity], "shouldBlur": severity in ("HIGH", "MEDIUM"),
        "imageAnalysis": image_result,
    }

@app.route("/detect-harmful", methods=["POST"])
def detect_harmful():
    body = request.get_json(force=True, silent=True)
    if body is None:
        return jsonify({"error": "Invalid JSON body"}), 400

    text       = (body.get("text") or "").strip()
    post_id    = body.get("postId")
    user_id    = body.get("userId")
    image_urls = body.get("imageUrls") or []

    if not text and not image_urls:
        return jsonify({"error": "text or imageUrls required"}), 400

    image_result = _analyse_images(image_urls) if image_urls else None

    if text:
        print(f"[harmful] Analysing postId={post_id} text={text[:80]}…")
        result = _build_harmful_response(text, harmful_model, image_result)
    else:
        if image_result and image_result.get("hasHarmfulImage"):
            result = {"isHarmful": True, "severity": "HIGH", "category": "MEDICAL_EMERGENCY",
                      "categoryLabel": HARMFUL_CATEGORIES["MEDICAL_EMERGENCY"], "confidence": 80.0,
                      "warningMessage": "⚠️ This image may contain harmful content.",
                      "blurMessage": "⚠️ This post contains potentially distressing imagery.",
                      "shouldBlur": True, "imageAnalysis": image_result}
        else:
            result = {"isHarmful": False, "severity": "NONE", "category": "SAFE",
                      "categoryLabel": "Safe content", "confidence": 99.0,
                      "warningMessage": None, "blurMessage": None, "shouldBlur": False,
                      "imageAnalysis": image_result}

    result["postId"] = post_id
    result["userId"] = user_id
    print(f"[harmful] → isHarmful={result['isHarmful']} severity={result['severity']} category={result['category']}")
    return jsonify(result)

@app.route("/detect-harmful/batch", methods=["POST"])
def detect_harmful_batch():
    items = request.get_json(force=True, silent=True)
    if not isinstance(items, list):
        return jsonify({"error": "expected a JSON array"}), 400
    results = []
    for item in items:
        text    = (item.get("text") or "").strip()
        post_id = item.get("postId")
        if not text:
            results.append({"postId": post_id, "isHarmful": False, "severity": "NONE"})
            continue
        r = _build_harmful_response(text, harmful_model)
        r["postId"] = post_id
        results.append(r)
    return jsonify(results)

@app.route("/train/harmful", methods=["POST"])
def retrain_harmful():
    def _run():
        global harmful_model
        train_harmful()
        harmful_model = joblib.load(HARMFUL_MODEL_PATH)
        print("[harmful] Model hot-reloaded ✅")
    threading.Thread(target=_run, daemon=True).start()
    return jsonify({"status": "harmful content model training started"})


# =============================================================================
#  FAKE INFO / MISINFORMATION DETECTION
# =============================================================================

def _fake_info_keyword_check(text: str):
    text_lower = text.lower()
    for category, patterns in FAKE_INFO_KEYWORDS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                return category
    return None

def _build_fake_info_response(text: str, model) -> dict:
    """
    Returns a dict with isFakeInfo (bool) and all display fields.
    KEY FIX: field is named "isFakeInfo" not "isFake".
    """
    SAFE_RESPONSE = {
        "isFakeInfo": False, "label": "VERIFIED",
        "labelText": "No misinformation detected", "confidence": 99.0,
        "category": "SAFE", "categoryLabel": FAKE_INFO_CATEGORIES["SAFE"],
        "warningMessage": None, "badgeText": None, "badgeIcon": None,
        "severity": None, "shouldWarn": False,
    }

    if len(text.split()) < MIN_WORD_COUNT:
        return SAFE_RESPONSE

    proba       = model.predict_proba([text])[0]
    fake_prob   = float(proba[1])
    kw_category = _fake_info_keyword_check(text)

    if kw_category:
        detected_category = kw_category
        cat_confidence    = max(fake_prob, 0.82)
    else:
        if fake_prob < ML_ONLY_THRESHOLD or fake_prob < FALLBACK_THRESHOLD:
            return SAFE_RESPONSE
        detected_category = "UNVERIFIED_TREATMENT"
        cat_confidence    = fake_prob

    category_label = FAKE_INFO_CATEGORIES.get(detected_category, "Unverified claim")

    high_risk_cats   = {"DANGEROUS_REMEDY", "FALSE_VACCINE_CLAIM", "FALSE_MEDICATION_CLAIM", "FAKE_SYMPTOM_ADVICE"}
    medium_risk_cats = {"HARMFUL_NUTRITION", "UNVERIFIED_TREATMENT", "CONSPIRACY_HEALTH"}

    if detected_category in high_risk_cats:
        severity    = "HIGH"
        badge_text  = "Not medically verified"
        badge_icon  = "gpp_bad"
        badge_color = "danger"
    elif detected_category in medium_risk_cats:
        severity    = "MEDIUM"
        badge_text  = "Unverified claim"
        badge_icon  = "warning_amber"
        badge_color = "warning"
    else:
        severity    = "LOW"
        badge_text  = "Unverified information"
        badge_icon  = "info_outline"
        badge_color = "info"

    warning_messages = {
        "DANGEROUS_REMEDY":       "This post describes a potentially dangerous home remedy. Please consult a qualified healthcare provider before trying any home treatment.",
        "FALSE_VACCINE_CLAIM":    "This post contains vaccine claims that contradict established medical evidence. Please consult your doctor or a trusted health authority.",
        "FAKE_SYMPTOM_ADVICE":    "The advice in this post about managing symptoms may be dangerous. Always seek professional medical advice during pregnancy.",
        "HARMFUL_NUTRITION":      "This post contains nutritional advice that may be harmful during pregnancy. Please consult your doctor or a registered dietitian.",
        "FALSE_MEDICATION_CLAIM": "This post makes unverified claims about medication safety. Never change your prescribed medication without consulting your doctor.",
        "PSEUDOSCIENCE":          "This post promotes alternative therapies not supported by clinical evidence. Please discuss any treatments with your healthcare provider.",
        "CONSPIRACY_HEALTH":      "This post contains health conspiracy claims. For reliable medical information, please consult qualified healthcare professionals.",
        "UNVERIFIED_TREATMENT":   "This post describes a treatment not verified by medical evidence. Always consult a healthcare professional before trying new treatments.",
    }

    return {
        "isFakeInfo":     True,                # ← THE CRITICAL FIELD Angular reads
        "label":          "NOT_MEDICALLY_VERIFIED",
        "labelText":      "Not medically verified",
        "confidence":     round(cat_confidence * 100, 1),
        "category":       detected_category,
        "categoryLabel":  category_label,
        "severity":       severity,
        "badgeText":      badge_text,
        "badgeIcon":      badge_icon,
        "badgeColor":     badge_color,
        "warningMessage": warning_messages.get(
            detected_category,
            "This post contains information that has not been medically verified. Please consult a healthcare professional."
        ),
        "shouldWarn": True,
    }

@app.route("/detect-fake-info", methods=["POST"])
def detect_fake_info():
    body = request.get_json(force=True, silent=True)
    if body is None:
        return jsonify({"error": "Invalid JSON body"}), 400

    text    = (body.get("text") or "").strip()
    post_id = body.get("postId")
    user_id = body.get("userId")

    if not text:
        return jsonify({"error": "text is required"}), 400

    print(f"[fake_info] Analysing postId={post_id} text={text[:80]}…")
    result = _build_fake_info_response(text, fake_info_model)
    result["postId"] = post_id
    result["userId"] = user_id
    print(f"[fake_info] Result → isFakeInfo={result['isFakeInfo']} category={result['category']}")
    return jsonify(result)

@app.route("/detect-fake-info/batch", methods=["POST"])
def detect_fake_info_batch():
    items = request.get_json(force=True, silent=True)
    if not isinstance(items, list):
        return jsonify({"error": "expected a JSON array"}), 400
    results = []
    for item in items:
        text    = (item.get("text") or "").strip()
        post_id = item.get("postId")
        if not text:
            results.append({"postId": post_id, "isFakeInfo": False, "label": "VERIFIED"})
            continue
        r = _build_fake_info_response(text, fake_info_model)
        r["postId"] = post_id
        results.append(r)
    return jsonify(results)

@app.route("/train/fake-info", methods=["POST"])
def retrain_fake_info():
    def _run():
        global fake_info_model
        train_fake_info()
        fake_info_model = joblib.load(FAKE_INFO_MODEL_PATH)
        print("[fake_info] Model hot-reloaded ✅")
    threading.Thread(target=_run, daemon=True).start()
    return jsonify({"status": "fake info model training started"})


# =============================================================================
#  MATCH SCORING
# =============================================================================

@app.route("/score", methods=["POST"])
def score():
    candidates = request.get_json(force=True)
    if not candidates:
        return jsonify([])
    X = np.array([[c[f] for f in MATCH_FEATURES] for c in candidates], dtype=float)
    raw_scores = match_model.predict(X)
    scores_100 = (raw_scores - 1) / 4 * 100
    result = [{"userId": c["userId"], "score": round(float(s), 1)} for c, s in zip(candidates, scores_100)]
    result.sort(key=lambda x: x["score"], reverse=True)
    return jsonify(result[:5])

@app.route("/train/match", methods=["POST"])
def retrain_match():
    threading.Thread(target=lambda: subprocess.run(["python", "train_match.py"]), daemon=True).start()
    return jsonify({"status": "match model training started"})


# =============================================================================
#  PRODUCT RECOMMENDATIONS
# =============================================================================

def _trimester(week):
    if week < 0: return 0
    if week < 14: return 1
    if week < 28: return 2
    return 3

def _price_bucket(prix):
    if prix <= 30: return 0.0
    if prix <= 100: return 1.0
    return 2.0

def _encode_category(cat):
    classes = rec_meta.get("label_encoder_classes", [])
    cat = (cat or "unknown").strip()
    return float(classes.index(cat)) if cat in classes else float(len(classes))

def _domain_score(user, product):
    cat = (product.get("category") or "").lower()
    score = 0.0
    preg_status = user.get("preg_status","").upper()
    trimester   = _trimester(user.get("preg_week",-1))
    baby_age    = user.get("min_baby_age",-1)
    is_twin     = int(user.get("is_twin",0))
    has_girl    = int(user.get("has_girl",0))
    has_boy     = int(user.get("has_boy",0))
    preg_week   = user.get("preg_week",-1)
    if any(k in cat for k in ["maternit","grossesse","pregnancy","prenatal","prénatal"]):
        score += 2.0 if preg_status=="ACTIVE" else 0.5
    if any(k in cat for k in ["bébé","bebe","baby","infant","nourrisson"]):
        if 0<=baby_age<=12: score+=2.5
        elif 12<baby_age<=36: score+=1.5
        elif baby_age>36: score+=0.5
    if is_twin and any(k in cat for k in ["twin","jumeau","double"]): score+=1.5
    if has_girl and any(k in cat for k in ["fille","girl","rose","pink"]): score+=1.0
    if has_boy  and any(k in cat for k in ["garçon","boy","bleu","blue"]): score+=1.0
    if trimester==1 and any(k in cat for k in ["nausée","nausee","vitamine"]): score+=1.2
    if trimester==3 and any(k in cat for k in ["accouchement","layette","naissance"]): score+=1.5
    nom=(product.get("nom") or "").lower()
    if preg_status=="ACTIVE" and any(k in nom for k in ["grossesse","maternit","pregnancy"]): score+=1.0
    if baby_age>=0 and any(k in nom for k in ["bébé","bebe","baby"]): score+=1.0
    return score

def _ai_reason(user, product, score):
    cat=  (product.get("category") or "").lower()
    trimester=_trimester(user.get("preg_week",-1))
    baby_age=user.get("min_baby_age",-1)
    is_twin=int(user.get("is_twin",0))
    has_girl=int(user.get("has_girl",0))
    has_boy=int(user.get("has_boy",0))
    preg_week=user.get("preg_week",-1)
    reasons=[]
    if any(k in cat for k in ["maternit","grossesse","pregnancy","prenatal"]):
        reasons.append(f"Perfect for trimester {trimester} of your pregnancy" if trimester>0 else "Tailored for expecting mothers")
    if any(k in cat for k in ["bébé","bebe","baby","infant"]):
        if 0<=baby_age<=3: reasons.append(f"Ideal for newborns ({baby_age} months old)")
        elif 3<baby_age<=12: reasons.append(f"Great for your {baby_age}-month-old baby")
        elif 12<baby_age<=36: reasons.append(f"Suitable for your {baby_age}-month-old toddler")
    if is_twin: reasons.append("Specially selected for twin pregnancies")
    if has_girl and "fille" in cat: reasons.append("Matched to your baby girl")
    if has_boy  and "garçon" in cat: reasons.append("Matched to your baby boy")
    if trimester==3 and any(k in cat for k in ["accouchement","layette"]):
        reasons.append(f"Essential for your upcoming birth at week {int(preg_week)}")
    if trimester==1 and any(k in cat for k in ["nausée","vitamine"]):
        reasons.append("Helpful for first-trimester comfort")
    if not reasons:
        if score>60: reasons.append("Highly rated by mothers with a similar profile")
        elif score>40: reasons.append("Recommended based on your pregnancy and baby data")
        else: reasons.append("Popular among our community of mothers")
    return ". ".join(reasons[:2])+"."

@app.route("/recommend", methods=["POST"])
def recommend():
    body=request.get_json(force=True)
    user=body.get("user",{})
    products=body.get("products",[])
    if not products: return jsonify([])
    trimester=_trimester(user.get("preg_week",-1))
    is_twin=int(user.get("is_twin",0))
    baby_count=int(user.get("baby_count",0))
    min_baby_age=float(user.get("min_baby_age",-1))
    has_girl=int(user.get("has_girl",0))
    has_boy=int(user.get("has_boy",0))
    rows=[]
    for p in products:
        rows.append([trimester,is_twin,baby_count,min_baby_age,has_girl,has_boy,
                     int((p.get("stock") or 0)>0),_price_bucket(float(p.get("prix",0) or 0)),
                     _domain_score(user,p),_encode_category(p.get("category","unknown")),
                     float(p.get("prix",0) or 0)])
    X=pd.DataFrame(rows,columns=REC_FEATURES)
    proba=rec_model.predict_proba(X)[:,1]
    MAX_DOMAIN=8.0
    scored=[]
    for i,p in enumerate(products):
        domain_norm=min(_domain_score(user,p)/MAX_DOMAIN,1.0)
        blended=0.65*float(proba[i])+0.35*domain_norm
        scored.append({"productId":p.get("product_id"),"relevanceScore":round(blended*100,1),"aiReason":_ai_reason(user,p,round(blended*100,1))})
    scored.sort(key=lambda x:x["relevanceScore"],reverse=True)
    return jsonify([r for r in scored if r["relevanceScore"]>0][:10])

@app.route("/train/products", methods=["POST"])
def retrain_products():
    threading.Thread(target=lambda: subprocess.run(["python","train_products.py"]), daemon=True).start()
    return jsonify({"status": "product model training started"})


# =============================================================================
#  TEXT SUMMARIZATION
# =============================================================================

def _build_summary(text: str) -> str:
    import re
    filler_patterns = [
        r"^heyy?\s+(guys?|everyone|ladies|mamas?)[,!]?\s*",
        r"^hi+\s+(guys?|everyone|ladies|mamas?)[,!]?\s*",
        r"^hello\s+(guys?|everyone|ladies|mamas?)[,!]?\s*",
        r"^(so\s+)?i\s+just\s+wanted\s+to\s+(check\s+in|share|say|post)[,.]?\s*",
        r"^(hey|hi|hello)[,!]?\s*",
    ]
    cleaned_text = text.strip()
    for p in filler_patterns:
        cleaned_text = re.sub(p, "", cleaned_text, flags=re.IGNORECASE).strip()
    if cleaned_text:
        cleaned_text = cleaned_text[0].upper() + cleaned_text[1:]

    sentences = re.split(r'(?<=[.!?])\s+', cleaned_text)
    sentences = [s.strip() for s in sentences if len(s.strip().split()) >= 5]

    if not sentences:
        words = cleaned_text.split()
        return " ".join(words[:30]) + ("…" if len(words) > 30 else "")
    if len(sentences) == 1:
        words = sentences[0].split()
        return " ".join(words[:35]) + ("…" if len(words) > 35 else "")

    TOPIC_KEYWORDS = {
        "pregnant":3,"pregnancy":3,"trimester":3,"prenatal":3,"baby":3,"birth":3,
        "labor":3,"delivery":3,"postpartum":3,"breastfeeding":3,"midwife":3,
        "doctor":2,"hospital":2,"scan":2,"ultrasound":2,"contractions":3,
        "bleeding":3,"pain":2,"nausea":2,"miscarriage":3,"fertility":3,"ivf":3,
        "struggling":2,"excited":2,"scared":2,"worried":2,"exhausted":2,
        "overwhelmed":2,"grateful":2,"difficult":2,"support":2,"advice":2,
    }
    STOP = {"i","me","my","we","our","you","your","he","she","it","they","this","that",
            "am","is","are","was","were","be","been","have","has","had","do","does",
            "a","an","the","and","but","or","for","so","at","by","in","of","on","to",
            "as","if","not","with","from","just","also","very","really","even","more"}

    def score_sentence(s):
        words_lower = [w.lower().strip(".,!?") for w in s.split()]
        content = [w for w in words_lower if w not in STOP and len(w) > 2]
        if not content: return 0.0
        topic = sum(TOPIC_KEYWORDS.get(w, 0) for w in content)
        length = len(words_lower)
        lb = 1.2 if 10 <= length <= 25 else (0.8 if length > 35 else 1.0)
        pen = 0.6 if words_lower and words_lower[0] in {"and","but","so","or","also"} else 1.0
        return (topic / len(content)) * lb * pen

    scores = [score_sentence(s) for s in sentences]
    best_idx = max(range(len(scores)), key=lambda i: scores[i])
    best = sentences[best_idx] if scores[best_idx] > 0 else sentences[0]

    words = best.split()
    if len(words) > 35:
        best = " ".join(words[:35]).rstrip(".,") + "…"
    best = best.strip()
    if best:
        best = best[0].upper() + best[1:]
    return best

@app.route("/summarize", methods=["POST"])
def summarize():
    body = request.get_json(force=True, silent=True)
    if body is None:
        return jsonify({"error": "Invalid JSON body"}), 400
    text    = (body.get("text") or "").strip()
    post_id = body.get("postId")
    if not text:
        return jsonify({"error": "text is required"}), 400
    word_count = len(text.split())
    if word_count < 15:
        return jsonify({"postId": post_id, "summary": text, "originalLength": len(text),
                        "summaryLength": len(text), "note": "Text too short to summarize"})
    print(f"[summary] Summarising postId={post_id} ({word_count} words)…")
    try:
        summary = _build_summary(text)
    except Exception as e:
        return jsonify({"error": f"Summarization failed: {str(e)}"}), 500
    return jsonify({"postId": post_id, "summary": summary,
                    "originalLength": len(text), "summaryLength": len(summary)})

@app.route("/train/summary", methods=["POST"])
def retrain_summary():
    def _run():
        global summary_model
        from train_summary import train as train_summary_model
        train_summary_model()
        summary_model = joblib.load(SUMMARY_MODEL_PATH)
    threading.Thread(target=_run, daemon=True).start()
    return jsonify({"status": "summary model initialised"})


# =============================================================================
#  SHARED ROUTES
# =============================================================================

@app.route("/train/all", methods=["POST"])
def retrain_all():
    def _run():
        global harmful_model, fake_info_model, summary_model
        subprocess.run(["python","train_match.py"])
        subprocess.run(["python","train_products.py"])
        train_harmful()
        train_fake_info()
        from train_summary import train as train_summary_model
        train_summary_model()
        summary_model   = joblib.load(SUMMARY_MODEL_PATH)
        harmful_model   = joblib.load(HARMFUL_MODEL_PATH)
        fake_info_model = joblib.load(FAKE_INFO_MODEL_PATH)
        print("[all] All models retrained ✅")
    threading.Thread(target=_run, daemon=True).start()
    return jsonify({"status": "all models training started"})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "models": {
        "match":     os.path.exists(MATCH_MODEL_PATH),
        "products":  os.path.exists(REC_MODEL_PATH),
        "harmful":   os.path.exists(HARMFUL_MODEL_PATH),
        "fake_info": os.path.exists(FAKE_INFO_MODEL_PATH),
        "summary":   os.path.exists(SUMMARY_MODEL_PATH),
    }})

if __name__ == "__main__":
    app.run(port=5000, debug=False)