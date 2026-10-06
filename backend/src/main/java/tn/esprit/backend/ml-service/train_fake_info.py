"""
train_fake_info.py  –  Fake / Misinformation Detection Model
=============================================================
Fixed version:
  - Minimum word count guard (< 6 words → SAFE automatically)
  - ML-only threshold raised to 0.65 (was 0.45 — caused mass false positives)
  - Keyword threshold kept at 0.35 (keywords are precise enough)
  - UNVERIFIED_TREATMENT fallback requires confidence >= 0.72
  - Fixed vaccine keyword regex to catch indirect phrasing
  - Added 40+ short safe posts to training data to stop "d", "heyy" etc triggering
"""

import os
import json
import joblib
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# ── Output paths ──────────────────────────────────────────────────────────────
FAKE_INFO_MODEL_PATH = "fake_info_model.pkl"
FAKE_INFO_META_PATH  = "fake_info_meta.json"

# ── Detection thresholds ──────────────────────────────────────────────────────
ML_ONLY_THRESHOLD  = 0.65   # no keyword match → need 65% ML confidence
KEYWORD_THRESHOLD  = 0.35   # keyword matched  → 35% ML confidence is enough
MIN_WORD_COUNT     = 6      # fewer words than this → always SAFE, skip ML
FALLBACK_THRESHOLD = 0.72   # for UNVERIFIED_TREATMENT (no specific keyword)

# ── Category labels ───────────────────────────────────────────────────────────
FAKE_INFO_CATEGORIES = {
    "SAFE":                   "Verified / safe content",
    "DANGEROUS_REMEDY":       "Dangerous home remedy",
    "FALSE_VACCINE_CLAIM":    "False vaccine claim",
    "FAKE_SYMPTOM_ADVICE":    "Unverified symptom advice",
    "HARMFUL_NUTRITION":      "Harmful nutrition claim",
    "FALSE_MEDICATION_CLAIM": "False medication claim",
    "PSEUDOSCIENCE":          "Pseudoscientific claim",
    "CONSPIRACY_HEALTH":      "Health conspiracy theory",
    "UNVERIFIED_TREATMENT":   "Unverified treatment claim",
}

# ── Keyword patterns (high-precision — a match here is almost certainly fake) ─
FAKE_INFO_KEYWORDS = {
    "DANGEROUS_REMEDY": [
        r"\bbleach\b",
        r"\bturpentine\b",
        r"\bkerosene\b",
        r"\burine\s+therap",
        r"\bdrink\s+your\s+own\s+urine\b",
        r"\bmiracle\s+cure\b",
        r"\bcure\s+cancer\s+with\b",
        r"\bessential\s+oil\s+cure",
        r"\bcastor\s+oil\s+induc",
        r"\bpennyroyal\b",
        r"\bherbal\s+abort",
        r"\bpapaya\s+(to\s+)?abort",
        r"\bpineapple\s+(to\s+)?abort",
        r"\btansy\b",
        r"\bblue\s+cohosh\b",
        r"\bblack\s+cohosh\s+induc",
        r"\bvitamin\s+c\s+(to\s+)?abort",
    ],
    "FALSE_VACCINE_CLAIM": [
        r"\bvaccines?\s+(cause[sd]?|causing|linked\s+to|can\s+cause)\s+autism\b",
        r"\bautism\s+(is\s+)?caused\s+by\s+vaccines?\b",
        r"\bvaccines?\s+are\s+poison(ous)?\b",
        r"\bvaccines?\s+are\s+toxic\b",
        r"\bdon.?t\s+vaccinate\b",
        r"\bskip\s+vaccin",
        r"\bavoid\s+vaccin",
        r"\bno\s+vaccines?\b",
        r"\bvaccines?\s+contain\s+microchip",
        r"\bcovid\s+vaccine\s+(change[sd]?\s+(your\s+)?dna|dna)",
        r"\bmrna\s+(vaccine[s]?\s+)?change[sd]?\s+(your\s+)?dna",
        r"\bflu\s+shot\s+cause[sd]?\s+miscarriage",
        r"\bmmr\s+(vaccine\s+)?(cause[sd]?|linked\s+to)\s+autism",
        r"\banti.?vaxx\b",
        r"\bvaccines?\s+dangerous\s+(to\s+)?(newborn|baby|child)",
        r"\bvaccines?\s+poison(ous)?\b",
    ],
    "FAKE_SYMPTOM_ADVICE": [
        r"\bignore\s+the\s+bleed",
        r"\bnormal\s+to\s+bleed\s+a\s+lot",
        r"\bcontractions\s+are\s+fine\s+at\s+home",
        r"\bpreeclampsia\s+goes\s+away",
        r"\bjust\s+rest\s+instead\s+of\s+(seeing\s+a\s+)?doctor",
        r"\bno\s+need\s+to\s+see\s+a\s+doctor",
        r"\bdoctors?\s+just\s+want\s+(your\s+)?money",
        r"\bhospital\s+will\s+harm\s+you",
        r"\bhome\s+birth\s+(is\s+)?safer\s+than\s+hospital",
        r"\bdon.?t\s+tell\s+your\s+doctor",
    ],
    "HARMFUL_NUTRITION": [
        r"\braw\s+meat\s+during\s+pregnancy",
        r"\beat\s+placenta\s+raw",
        r"\bfasting\s+while\s+pregnant",
        r"\bstarve\s+to\s+lose\s+baby\s+weight",
        r"\bonly\s+juice\s+diet\s+(while\s+)?pregnant",
        r"\balcohol\s+in\s+moderation\s+is\s+fine\s+(while\s+)?pregnant",
        r"\bsmoking\s+is\s+okay\s+if",
        r"\ba\s+little\s+wine\s+won.?t\s+hurt\s+(the\s+baby|during\s+pregnancy)",
        r"\bdiet\s+pills?\s+while\s+pregnant",
        r"\blaxative\s+detox\s+(tea|diet)",
    ],
    "FALSE_MEDICATION_CLAIM": [
        r"\bibuprofen\s+is\s+safe\s+(while\s+|during\s+)?pregnant",
        r"\baspirin\s+is\s+fine\s+(in\s+the\s+)?third\s+trimester",
        r"\btake\s+double\s+dose",
        r"\bstop\s+taking\s+(your\s+)?prescribed",
        r"\breplace\s+(your\s+)?medication\s+with\s+herb",
        r"\bopioid[s]?\s+(are\s+)?safe\s+(while\s+)?pregnant",
        r"\bprenatal\s+vitamins?\s+are\s+a\s+scam",
        r"\bfolic\s+acid\s+is\s+fake",
    ],
    "PSEUDOSCIENCE": [
        r"\bcrystal\s+heal",
        r"\bhomeopat",
        r"\bdetox\s+cure[sd]?\s+everything",
        r"\bessential\s+oils?\s+replace\s+(all\s+)?medicine",
        r"\balkaline\s+water\s+cure[sd]",
        r"\bcolloidal\s+silver\s+cure[sd]",
        r"\bozone\s+therapy\s+cure[sd]",
        r"\bmagnetic\s+therapy\s+cure[sd]",
        r"\breiki\s+cure[sd]?\s+disease",
        r"\benergy\s+healing\s+replace",
        r"\bastrology\s+(can\s+)?predict\s+(your\s+)?health",
    ],
    "CONSPIRACY_HEALTH": [
        r"\bbig\s+pharma\s+hides",
        r"\bdoctors?\s+hide\s+the\s+cure",
        r"\bgovernment\s+putting\s+chemicals",
        r"\bchemtrails?\s+caus",
        r"\b5g\s+(towers?\s+)?(cause[sd]?|causing)\s+(health|cancer|disease|miscarriage)",
        r"\bfluoride\s+(is\s+)?poison",
        r"\bgmo\s+cause[sd]?\s+cancer",
        r"\bdepopulation\s+agenda",
        r"\bthey\s+don.?t\s+want\s+you\s+to\s+know",
        r"\bsterilization\s+(chemicals|agents)\s+in",
    ],
    "UNVERIFIED_TREATMENT": [
        r"\bcure[sd]?\s+my\s+cancer\s+with\b",
        r"\beliminated\s+diabetes\s+with\b",
        r"\breversed\s+autism\s+with\b",
        r"\bcured\s+autism\b",
        r"\bguaranteed\s+to\s+heal\b",
        r"\b100%\s+natural\s+cure\b",
        r"\bscientifically\s+proven\s+by\s+me\b",
        r"\bdoctors?\s+hate\s+this\b",
        r"\bone\s+weird\s+trick\s+for\s+health\b",
        r"\bbig\s+secret\s+cure\b",
    ],
}

# ── Training data ─────────────────────────────────────────────────────────────
TRAINING_DATA = [
    # SAFE — normal long posts
    ("My doctor recommended folic acid supplements during pregnancy.", 0),
    ("I had my 20-week ultrasound today, everything looks great!", 0),
    ("Feeling tired in the first trimester is completely normal.", 0),
    ("My midwife suggested gentle walking for backaches.", 0),
    ("The hospital tour was so reassuring, I feel ready.", 0),
    ("I've been drinking lots of water and eating balanced meals.", 0),
    ("My OB said the heartburn should ease in the third trimester.", 0),
    ("We chose to vaccinate our baby on the recommended schedule.", 0),
    ("Breastfeeding can be hard but a lactation consultant really helped.", 0),
    ("The prenatal yoga class taught me great breathing techniques.", 0),
    ("I consulted my doctor before taking any supplements.", 0),
    ("Regular prenatal check-ups are so important.", 0),
    ("My GP prescribed iron supplements for mild anaemia.", 0),
    ("The baby's heartbeat sounded perfect at today's appointment.", 0),
    ("I switched to a pregnancy-safe skincare routine.", 0),
    ("Eating small, frequent meals helped my morning sickness.", 0),
    ("My doctor approved light swimming during pregnancy.", 0),
    ("I asked my pharmacist before taking any over-the-counter medicine.", 0),
    ("The NIPT test came back low risk, we are so relieved!", 0),
    ("Sleep on your left side to improve circulation, my midwife said.", 0),
    ("Postpartum check-ups are just as important as prenatal ones.", 0),
    ("The pediatrician walked us through all the vaccination milestones.", 0),
    ("I'm so grateful for the support of my healthcare team.", 0),
    ("Group B strep testing is routine and nothing to worry about.", 0),
    ("My therapist helped me manage pregnancy anxiety.", 0),
    ("Staying hydrated is key, especially in the second trimester.", 0),
    ("The birthing center was calm and well-equipped.", 0),
    ("I discussed epidural options with my anesthesiologist.", 0),
    ("Gentle stretching under physio guidance helped my pelvic pain.", 0),
    ("We trust our paediatrician's advice on introducing solids.", 0),
    ("I'm taking the prescribed iron and vitamin D as directed.", 0),
    ("My OBGYN explained all the risks and benefits clearly.", 0),
    ("Hand-washing is the best way to protect a newborn from illness.", 0),
    ("The NICU staff were incredible during our premature birth.", 0),
    ("I followed the recommended weight gain guidelines.", 0),
    ("Antenatal classes taught my partner how to support me in labour.", 0),
    ("My doctor adjusted my thyroid medication during pregnancy.", 0),
    ("The glucose tolerance test showed I don't have gestational diabetes.", 0),
    ("I use an approved pregnancy pillow for back support.", 0),
    ("My pediatrician said the rash was just baby acne, totally normal.", 0),
    ("Some women experience spotting in early pregnancy, always check with doctor.", 0),
    ("Iron deficiency is common in pregnancy and easily treated.", 0),
    ("Morning sickness usually peaks around 8-10 weeks for most women.", 0),
    ("Caesarean sections are sometimes medically necessary and life-saving.", 0),
    ("Epidurals are safe and widely used to manage labour pain.", 0),
    ("Gestational diabetes requires monitoring and dietary management.", 0),
    ("Postpartum depression is a medical condition requiring professional care.", 0),
    ("Thyroid conditions during pregnancy need careful medication adjustments.", 0),
    ("Premature babies in the NICU receive specialised life-saving care.", 0),

    # SAFE — short posts / greetings / emotional posts (the false-positive culprits)
    ("Hey everyone, just joined this community!", 0),
    ("Hello! Happy to be here.", 0),
    ("heyyyyyy just wanted to say hi to everyone here!", 0),
    ("hi ladies how is everyone doing today?", 0),
    ("Good morning everyone hope you have a great day!", 0),
    ("Happy to connect with other moms here on this platform.", 0),
    ("pregnancy is such a journey, loving every moment of it.", 0),
    ("So excited for this baby, cannot wait to meet them!", 0),
    ("Just found out I am pregnant, feeling so many emotions right now!", 0),
    ("Feeling nauseous today but doctor says it is normal in first trimester.", 0),
    ("I experienced some light bleeding and my doctor said it was normal spotting.", 0),
    ("I had light bleeding in early pregnancy but it resolved completely.", 0),
    ("I am experiencing some bleeding today, going to call my midwife now.", 0),
    ("Bleeding in the first trimester can be normal but always check with your OB.", 0),
    ("I just wrote down my biggest fear and it has been terrifying being pregnant.", 0),
    ("Miscarriage is devastating and I am so sorry for your loss today.", 0),
    ("After my miscarriage I felt completely lost but grief support really helped me.", 0),
    ("Baby loss is heartbreaking and I am sending love to all who have been there.", 0),
    ("I am processing my loss and it has been so hard but therapy is helping me.", 0),
    ("Pregnancy after loss is emotionally very complex and takes a lot of support.", 0),
    ("Today I am thinking about my angel baby and how much I miss them.", 0),
    ("Support groups for pregnancy loss have been incredibly helpful for me.", 0),
    ("I am killing the exhaustion with naps because the third trimester is tough!", 0),
    ("I am absolutely killing it at prenatal yoga class this week!", 0),
    ("I truly believe babies are a blessing and I feel so grateful to be pregnant.", 0),
    ("I still remember the overwhelming emotions I felt during the postpartum period.", 0),
    ("Postpartum recovery is so hard but it is manageable with the right support.", 0),
    ("I just wanted to reach out and connect with all the other women here.", 0),
    ("Pregnancy is a life-changing experience that can be both exciting and scary.", 0),
    ("I have been thinking a lot about nutrition lately with all these changes.", 0),
    ("bling out after a difficult week, feeling more like myself again!", 0),
    ("I had some bleeding and it was really scary for me emotionally.", 0),
    ("Bleeding during pregnancy scared me but it turned out to be completely fine.", 0),
    ("I am so nervous about giving birth but my doctor has reassured me.", 0),
    ("Anyone else feeling overwhelmed in the third trimester? It is a lot!", 0),
    ("Vaccines are so important for protecting babies from serious diseases.", 0),
    ("I vaccinated my baby on schedule and the pediatrician was very helpful.", 0),
    ("We follow the recommended vaccine schedule and our baby is thriving.", 0),
    ("Getting the flu vaccine while pregnant is recommended by my doctor.", 0),
    ("The MMR vaccine is safe and my pediatrician explained everything clearly.", 0),

    # SAFE — very short posts (critical to prevent false positives on one-word posts)
    ("d", 0),
    ("heyy", 0),
    ("ok", 0),
    ("hello", 0),
    ("hi", 0),
    ("test", 0),
    ("wow", 0),
    ("lol", 0),
    ("omg", 0),
    ("yes", 0),
    ("no", 0),
    ("same", 0),
    ("me too", 0),
    ("thanks", 0),
    ("thank you so much", 0),
    ("love this community", 0),
    ("so true what you said", 0),
    ("agreed completely", 0),
    ("bleeding", 0),
    ("kiling baby", 0),

    # FAKE — clear misinformation
    ("Drink bleach to kill the virus and cure your infection!", 1),
    ("Vaccines cause autism, do NOT vaccinate your children!", 1),
    ("My doctor tells me that vaccine can cause autism and I agree with him.", 1),
    ("Vaccines are poisonous and toxic to newborns, avoid them completely.", 1),
    ("Don't vaccinate your baby because the MMR vaccine causes serious damage.", 1),
    ("The COVID vaccine changes your baby's DNA permanently and irreversibly.", 1),
    ("mRNA vaccines permanently alter your genetic code forever, avoid them.", 1),
    ("The flu shot causes miscarriages so refuse it when you are pregnant.", 1),
    ("Anti-vaxx is the only way to protect your child from pharmaceutical harm.", 1),
    ("Vaccines are poison and doctors are paid by pharma to push them on us.", 1),
    ("Vaccines contain microchips designed to track your baby after birth.", 1),
    ("Ignore the bleeding because it is completely normal and will stop on its own.", 1),
    ("Big pharma hides the real cancer cure, use this herbal remedy instead.", 1),
    ("Essential oils can replace all your medications because doctors are lying.", 1),
    ("Take high-dose vitamin C to abort naturally and safely at home.", 1),
    ("Papaya and pineapple will safely end your pregnancy without needing a doctor.", 1),
    ("Doctors don't want you to know that colloidal silver cures everything.", 1),
    ("Ibuprofen is totally safe to take throughout your entire pregnancy daily.", 1),
    ("Folic acid is a complete scam invented by big pharma to make money.", 1),
    ("A little wine every day is fine during pregnancy and doctors are wrong.", 1),
    ("Castor oil will safely induce labour at home with no hospital needed.", 1),
    ("5G towers are causing miscarriages and serious birth defects in babies.", 1),
    ("Chemtrails contain chemicals specifically designed to harm pregnant women.", 1),
    ("I completely cured my gestational diabetes with just baking soda water.", 1),
    ("Stop taking your prescribed medication and use essential oils instead.", 1),
    ("Homeopathy is scientifically proven to cure all pregnancy complications.", 1),
    ("Preeclampsia just goes away on its own so don't rush to the hospital.", 1),
    ("Hospital birth is far more dangerous than home birth without any midwife.", 1),
    ("Alkaline water can cure morning sickness and all pregnancy complications.", 1),
    ("Don't tell your doctor about your symptoms because they will just medicate you.", 1),
    ("The government is putting sterilization chemicals in prenatal vitamins now.", 1),
    ("Pennyroyal tea will safely terminate an unwanted pregnancy at home.", 1),
    ("Raw meat has essential enzymes for fetal development that cooking destroys.", 1),
    ("Fasting while pregnant completely cleanses toxins and is perfectly safe.", 1),
    ("Doctors hide the cure for autism and it can be reversed with this diet.", 1),
    ("One weird trick that doctors hate: skip prenatal care and use herbs.", 1),
    ("Eat your placenta raw immediately to prevent postpartum depression.", 1),
    ("Diet pills are completely safe during breastfeeding if they are natural.", 1),
    ("Magnetic therapy is guaranteed to heal all your postpartum symptoms.", 1),
    ("Crystal healing can fully replace antibiotics for postpartum infections.", 1),
    ("Blue cohosh tea safely induces labour and is better than hospital induction.", 1),
    ("Laxative detox tea during pregnancy removes harmful toxins from the body.", 1),
    ("Turpentine drops cure all infections including pregnancy complications.", 1),
    ("Doctors just want your money so avoid them and use colloidal silver.", 1),
    ("Reiki energy healing completely cured my serious pregnancy complication.", 1),
    ("Depopulation agenda: prenatal vitamins contain government sterilization agents.", 1),
    ("You should take double dose of iron supplements to speed up your results.", 1),
    ("They don't want you to know but smoking in moderation is okay while pregnant.", 1),
    ("Only juice diet while pregnant is the absolute healthiest option for baby.", 1),
    ("Tansy herb tea will fix all hormonal imbalances during pregnancy naturally.", 1),
    ("GMOs cause miscarriages so eat only completely organic food or risk it.", 1),
    ("Ozone therapy cures gestational diabetes and doctors are actively hiding this.", 1),
    ("Fluoride in water causes serious birth defects so only drink distilled water.", 1),
    ("100% natural supplements are always much safer than any prescribed medicine.", 1),
    ("Vaccines are toxic to newborns and scientifically proven to cause autism.", 1),
    ("My grandmother's remedy completely cured preeclampsia so skip the hospital.", 1),
    ("Doctors are paid by pharma to prescribe completely unnecessary prenatal vitamins.", 1),
    ("Urine therapy during pregnancy naturally and safely protects the baby.", 1),
    ("Miracle cure: just drink this tea and avoid all hospital interventions entirely.", 1),
    ("Essential oils diffused in the room can fully replace a NICU for premature babies.", 1),
    ("High-dose vitamin D megadosing completely cures all pregnancy complications.", 1),
    ("Astrology can accurately predict your baby's health better than ultrasounds.", 1),
    ("Energy healing sessions can fully replace the need for prenatal check-ups.", 1),
    ("Vaccines are dangerous and you should absolutely never give them to your child.", 1),
    ("The MMR vaccine is directly linked to autism and serious brain damage in babies.", 1),
    ("Vaccine ingredients are specifically toxic and designed to make children sick.", 1),
    ("Big pharma controls all doctors to push vaccines that are known to cause autism.", 1),
    ("Vaccines are poisonous chemicals injected into babies to weaken their immune systems.", 1),
    ("I stopped all my prescribed medications and switched to crystals and herbs instead.", 1),
]


def train():
    print("[fake_info] Preparing training data …")

    texts  = [t for t, _ in TRAINING_DATA]
    labels = [l for _, l in TRAINING_DATA]

    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.15, random_state=42, stratify=labels
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 3),
            max_features=15000,
            sublinear_tf=True,
            min_df=1,
            analyzer="word",
            token_pattern=r"(?u)\b\w+\b",
        )),
        ("clf", LogisticRegression(
            C=2.0,
            max_iter=1000,
            class_weight="balanced",
            solver="lbfgs",
            random_state=42,
        )),
    ])

    print("[fake_info] Training model …")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    print("[fake_info] Classification report:")
    print(classification_report(y_test, y_pred, target_names=["SAFE", "FAKE/DANGEROUS"]))

    joblib.dump(pipeline, FAKE_INFO_MODEL_PATH)
    print(f"[fake_info] Model saved → {FAKE_INFO_MODEL_PATH}")

    meta = {
        "categories":  FAKE_INFO_CATEGORIES,
        "label_names": ["SAFE", "FAKE_INFO"],
        "thresholds": {
            "ml_only":   ML_ONLY_THRESHOLD,
            "keyword":   KEYWORD_THRESHOLD,
            "min_words": MIN_WORD_COUNT,
            "fallback":  FALLBACK_THRESHOLD,
        }
    }
    with open(FAKE_INFO_META_PATH, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"[fake_info] Meta saved → {FAKE_INFO_META_PATH}")
    return pipeline


if __name__ == "__main__":
    train()
    print("[fake_info] ✅ Done.")