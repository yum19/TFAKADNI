"""
train_harmful_posts.py  v3
==========================
KEY CHANGES:
  - WEIGHTED pattern scoring: each keyword has a confidence weight (0.0-1.0)
    A single high-weight match (>= KEYWORD_FLAG_THRESHOLD=0.70) flags the post.
    Low-weight signals (bare "bleeding"=0.30) alone CANNOT flag anything.
  - "bleeding out" now caught (was missing from v1/v2)
  - Large safe-post set with medical words in normal positive contexts
  - Image analysis handled by app.py via HuggingFace free Inference API
"""

import joblib
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

HARMFUL_MODEL_PATH = "harmful_model.pkl"

HARMFUL_CATEGORIES = {
    "MISCARRIAGE":       "miscarriage / pregnancy loss",
    "BLEEDING":          "bleeding / hemorrhage",
    "SEVERE_PAIN":       "severe pain",
    "BABY_LOSS":         "infant / baby loss",
    "PREECLAMPSIA":      "preeclampsia / eclampsia",
    "PRETERM_LABOR":     "preterm labor",
    "ECTOPIC":           "ectopic pregnancy",
    "STILLBIRTH":        "stillbirth",
    "POSTPARTUM_CRISIS": "postpartum crisis / PPD emergency",
    "SELF_HARM":         "self-harm / suicidal ideation",
    "SUBSTANCE_ABUSE":   "substance abuse during pregnancy",
    "MEDICAL_EMERGENCY": "general medical emergency",
}

HIGH_SEVERITY   = {"BLEEDING","SEVERE_PAIN","PREECLAMPSIA","ECTOPIC","MEDICAL_EMERGENCY","SELF_HARM","PRETERM_LABOR"}
MEDIUM_SEVERITY = {"MISCARRIAGE","BABY_LOSS","STILLBIRTH","POSTPARTUM_CRISIS","SUBSTANCE_ABUSE"}

# Minimum weight for a keyword to ALONE trigger a flag
KEYWORD_FLAG_THRESHOLD = 0.70

# ─────────────────────────────────────────────────────────────────────────────
#  WEIGHTED KEYWORD PATTERNS
#  Tuple format: (regex, weight)
#  weight >= KEYWORD_FLAG_THRESHOLD → flag this category
#  Low-weight entries capture training signal but cannot fire alone.
# ─────────────────────────────────────────────────────────────────────────────
CATEGORY_KEYWORDS = {
    "BLEEDING": [
        # Unambiguous crisis phrases — high weight
        (r'\bbleeding\s+out\b',                                     0.95),  # ← screenshot fix
        (r'\bhemorrhag',                                             0.92),
        (r'\bhémorragie\b',                                          0.92),
        (r'\bheavy\s+bleeding\b',                                    0.90),
        (r'\bbleeding\s+(a\s+lot|heavily|non.?stop|profusely)\b',   0.90),
        (r'\bblood\s+won.?t\s+stop\b',                              0.90),
        (r'\bbleeding\s+won.?t\s+stop\b',                           0.90),
        (r'\blots?\s+of\s+blood\b',                                 0.88),
        (r'\bso\s+much\s+blood\b',                                  0.88),
        (r'\bbleeding\s+and\s+in\s+pain\b',                        0.90),
        (r'\bsaignements?\s+abondants?\b',                           0.90),
        (r'\bje\s+saigne\s+(beaucoup|abondamment)\b',               0.90),
        (r'\bperte\s+de\s+sang\s+importante\b',                     0.90),
        # Mid weight — bleeding + pregnancy context
        (r'\bbleeding\b.{0,40}\bpregnant\b',                       0.82),
        (r'\bbleeding\b.{0,30}\b\d+\s+weeks?\b',                  0.85),
        (r'\bbleeding\b.{0,30}\btrimester\b',                      0.82),
        (r'\bje\s+saigne\b',                                        0.80),
        (r'\bsaignements?\s+(rouge|vif|important)\b',               0.82),
        # Low weight — cannot flag alone
        (r'\bbleeding\b',                                           0.30),
        (r'\bblood\b',                                              0.18),
        (r'\bspotting\b',                                           0.12),
    ],

    "SEVERE_PAIN": [
        (r'\bsevere\s+pain\b',                                      0.90),
        (r'\bpain\s+is\s+unbearable\b',                             0.92),
        (r'\bunbearable\s+pain\b',                                  0.92),
        (r'\bexcruciating\b',                                       0.88),
        (r'\bdouleur\s+insupportable\b',                            0.90),
        (r'\bdouleur\s+intense\b',                                  0.85),
        (r'\bcan.?t\s+(move|walk|stand).{0,20}pain\b',             0.88),
        (r'\bpain\s+level\s+is\s+10\b',                            0.90),
        (r'\bviolent\s+cramping\b',                                 0.85),
        (r'\bcrampes?\s+violentes?\b',                              0.85),
        (r'\bextreme\s+pelvic\s+pain\b',                           0.88),
        (r'\bdouleur\s+pelvienne\s+extr',                          0.85),
        # Low
        (r'\bpain\b',                                               0.08),
        (r'\bdouleur\b',                                            0.08),
    ],

    "MISCARRIAGE": [
        (r'\bmiscarriage\b',                                        0.92),
        (r'\bmiscarried\b',                                         0.92),
        (r'\bfausse\s+couche\b',                                   0.92),
        (r'\bpregnancy\s+loss\b',                                   0.90),
        (r'\bperte\s+de\s+grossesse\b',                            0.90),
        (r'\bI\s+(lost|keep\s+losing)\s+my\s+baby\b',             0.90),
        (r'\bj.?ai\s+perdu\s+mon\s+bébé\b',                       0.90),
        (r'\bmissed\s+miscarriage\b',                              0.90),
    ],

    "BABY_LOSS": [
        (r'\bbaby\s+(died|passed\s+away|didn.?t\s+survive|didn.?t\s+make\s+it)\b', 0.93),
        (r'\bnewborn\s+died\b',                                     0.93),
        (r'\binfant\s+death\b',                                     0.92),
        (r'\bSIDS\b',                                               0.88),
        (r'\blost\s+our\s+(baby|newborn|son|daughter)\b',          0.88),
        (r'\bbébé\s+est\s+décédé\b',                               0.93),
        (r'\bmort\s+subite\s+du\s+nourrisson\b',                   0.93),
    ],

    "PREECLAMPSIA": [
        (r'\bpreeclampsia\b',                                       0.92),
        (r'\béclampsia\b',                                          0.92),
        (r'\beclampsia\b',                                          0.92),
        (r'\bpré.?éclampsie\b',                                     0.92),
        (r'\bdangerously\s+high\s+blood\s+pressure\b',             0.90),
        (r'\bblurry\s+vision.{0,30}pregnant\b',                    0.85),
        (r'\bvision\s+floue.{0,30}enceinte\b',                     0.85),
        (r'\bconvulsions?.{0,20}grossesse\b',                       0.90),
        (r'\bprotein\s+in\s+urine.{0,20}pregnant\b',               0.85),
    ],

    "PRETERM_LABOR": [
        (r'\bpreterm\s+labor\b',                                    0.92),
        (r'\bwaters?\s+broke.{0,20}\d+\s+weeks?\b',               0.92),
        (r'\bpoche\s+des\s+eaux\s+s.?est\s+rompue\b',             0.92),
        (r'\baccouchement\s+prématuré\b',                           0.92),
        (r'\btravail\s+prématuré\b',                               0.92),
        (r'\brupture\s+prématurée\s+des\s+membranes\b',            0.92),
        (r'\bin\s+early\s+labor.{0,20}\d+\s+weeks?\b',            0.90),
        (r'\bcontractions?.{0,20}every\s+\d+\s+minutes.{0,20}week\s+\d+\b', 0.90),
    ],

    "ECTOPIC": [
        (r'\bectopic\s+pregnancy\b',                                0.95),
        (r'\bgrossesse\s+extra.?utérine\b',                         0.95),
        (r'\bgrossesse\s+ectopique\b',                              0.95),
        (r'\btube\s+ruptured\b',                                    0.92),
        (r'\bectopic\b',                                            0.88),
    ],

    "STILLBIRTH": [
        (r'\bstillbirth\b',                                         0.95),
        (r'\bstillborn\b',                                          0.95),
        (r'\bstill.?born\b',                                        0.95),
        (r'\bmort.?né\b',                                           0.92),
        (r'\bMFIU\b',                                               0.92),
        (r'\bborn\s+still\b',                                       0.90),
    ],

    "POSTPARTUM_CRISIS": [
        (r'\bpostpartum\s+psychosis\b',                             0.95),
        (r'\bpsychose\s+(post.?partum|puerpérale)\b',              0.95),
        (r'\bwant\s+to\s+hurt\s+my\s+baby\b',                     0.95),
        (r'\benvie\s+de\s+faire\s+du\s+mal.{0,20}bébé\b',        0.95),
        (r'\bviolent\s+thoughts.{0,20}(newborn|baby)\b',           0.90),
        (r'\bhearing\s+voices\s+since\s+giving\s+birth\b',         0.90),
        (r'\bfeel\s+like\s+a\s+danger\s+to\s+my\s+(own\s+)?child\b', 0.90),
    ],

    "SELF_HARM": [
        (r'\bwant\s+to\s+die\b',                                    0.92),
        (r'\bkill\s+myself\b',                                      0.95),
        (r'\bend\s+my\s+life\b',                                    0.92),
        (r'\bsuicid',                                                0.92),
        (r'\bself.?harm',                                            0.90),
        (r'\bI\s+cut\s+myself\b',                                   0.90),
        (r'\bdon.?t\s+want\s+to\s+be\s+here\s+anymore\b',         0.88),
        (r'\bhurt\s+myself\b',                                      0.88),
        (r'\bje\s+veux\s+mourir\b',                                 0.92),
        (r'\bme\s+faire\s+du\s+mal\b',                             0.88),
        (r'\bpensées?\s+suicidaires?\b',                            0.90),
        (r'\bplan\s+to\s+end\s+my\s+life\b',                       0.95),
    ],

    "SUBSTANCE_ABUSE": [
        (r'\bdrinking\s+alcohol\s+during.{0,15}pregnancy\b',       0.90),
        (r'\btaking\s+drugs\s+while\s+pregnant\b',                 0.90),
        (r'\bused\s+(heroin|cocaine|drugs)\s+while\s+pregnant\b',  0.92),
        (r'\brelapsed\s+on\s+(cocaine|heroin|drugs)\s+while\s+pregnant\b', 0.92),
        (r'\bconsommation\s+d.alcool\s+pendant.{0,20}grossesse\b', 0.90),
        (r'\baddicted\s+and\s+pregnant\b',                         0.90),
        (r'\bdrogue\s+pendant.{0,15}trimestre\b',                  0.88),
    ],

    "MEDICAL_EMERGENCY": [
        (r'\bneed\s+an\s+ambulance\b',                             0.95),
        (r'\bcall\s+(911|112|15|SAMU)\b',                         0.95),
        (r'\bappel\s+SAMU\b',                                      0.95),
        (r'\bI\s+collapsed\b',                                     0.90),
        (r'\bj.?ai\s+perdu\s+connaissance\b',                     0.90),
        (r'\bseizure\s+during\s+pregnancy\b',                      0.92),
        (r'\bgoing\s+into\s+shock\b',                              0.90),
        (r'\bchoc\s+hémorragique\b',                               0.92),
        (r'\bje\s+n.?arrive\s+plus\s+à\s+respirer\b',            0.90),
        (r'\bI\s+(feel\s+like\s+I.?m\s+dying|think\s+I.?m\s+having\s+a\s+stroke)\b', 0.90),
        (r'\burgence\s+vitale\b',                                  0.90),
    ],
}


# ─────────────────────────────────────────────────────────────────────────────
TRAINING_DATA = {
    "MISCARRIAGE": [
        "I had a miscarriage last week and I don't know what to do",
        "J'ai fait une fausse couche hier soir",
        "We experienced a pregnancy loss at 12 weeks",
        "My miscarriage was devastating and I'm still bleeding",
        "I lost my baby at 10 weeks",
        "Perte de grossesse au premier trimestre",
        "The doctor confirmed the miscarriage this morning",
        "I keep miscarrying and I'm heartbroken",
        "Second miscarriage this year, I can't take it anymore",
        "Je viens de perdre mon bébé à 8 semaines de grossesse",
        "We had a missed miscarriage discovered at the scan",
        "I'm going through a miscarriage right now and I'm alone",
        "Fausse couche spontanée à 11 semaines",
        "I miscarried naturally at home and I'm terrified",
        "Two miscarriages in a row, I am completely devastated",
    ],
    "BLEEDING": [
        "I have heavy bleeding and I'm 6 months pregnant",
        "I'm bleeding a lot and I don't know what to do",
        "Je saigne beaucoup pendant ma grossesse",
        "There's so much blood, I'm scared",
        "I noticed lots of blood this morning while pregnant",
        "Heavy hemorrhage at 32 weeks",
        "I'm bleeding and in pain right now",
        "Saignements abondants au troisième trimestre",
        "I woke up bleeding heavily, I'm 30 weeks pregnant",
        "I'm losing so much blood after delivery",
        "The bleeding won't stop since I gave birth",
        "Saignements importants après ma césarienne",
        "I'm bleeding out and terrified please help",
        "My biggest fear is bleeding out during labor",
        "I just wrote down my biggest fear, bleeding out, during my pregnancy",
        "Massive hemorrhage after birth, rushed to ICU",
        "I can't stop the bleeding and I'm home alone",
        "Je saigne abondamment depuis l'accouchement",
        "Hémorragie post-partum sévère",
        "Bleeding out is my greatest fear as a pregnant woman",
    ],
    "SEVERE_PAIN": [
        "I have severe pain in my abdomen and can't move",
        "The pain is unbearable and I'm 8 months pregnant",
        "Douleur intense dans le ventre enceinte",
        "Extreme pelvic pain at 8 months pregnant",
        "Violent cramping and I'm 7 months pregnant",
        "Severe contractions at 30 weeks, not due yet",
        "La douleur est insupportable, je suis enceinte",
        "Excruciating abdominal pain during third trimester",
        "Crampes violentes à 28 semaines de grossesse",
        "My pain level is 10 out of 10 and I'm pregnant",
        "I cannot walk from the pain and I'm due in 2 months",
        "Terrible upper abdominal pain while pregnant",
        "The pain is so bad I cannot breathe",
        "Douleur pelvienne extrême, je ne peux plus marcher",
    ],
    "BABY_LOSS": [
        "My newborn died in the night",
        "We lost our baby to SIDS",
        "Mon bébé est décédé deux jours après la naissance",
        "Infant death at 3 weeks old",
        "My baby died unexpectedly at home",
        "We lost our newborn after birth complications",
        "La mort inattendue de notre nourrisson",
        "My 2 month old passed away last night",
        "Notre bébé de 6 semaines est décédé subitement",
        "We are devastated, our baby boy didn't survive",
        "Mort subite du nourrisson, notre vie est brisée",
        "The hospital told us our baby didn't make it",
        "Baby loss at 6 weeks old, I can't function",
    ],
    "PREECLAMPSIA": [
        "Diagnosed with preeclampsia at 34 weeks",
        "I have preeclampsia and need to be hospitalised",
        "Pré-éclampsie détectée à 30 semaines de grossesse",
        "Severe headache and blurry vision while pregnant",
        "My blood pressure is dangerously high during pregnancy",
        "I have preeclampsia symptoms with swollen face and hands",
        "I was rushed to hospital with eclampsia",
        "Preeclampsia at 28 weeks, baby may come early",
        "Vision floue et maux de tête violents enceinte",
        "Pré-éclampsie sévère, hospitalisation immédiate",
        "Protein in urine and high blood pressure at 36 weeks",
        "Convulsions pendant la grossesse à l'hôpital",
    ],
    "PRETERM_LABOR": [
        "I'm having contractions at 28 weeks, too early",
        "My waters broke at 30 weeks",
        "Accouchement prématuré à 32 semaines de grossesse",
        "Preterm labor at 29 weeks, rushed to hospital",
        "Travail prématuré déclenché bien trop tôt",
        "Contractions every 5 minutes at week 31",
        "Ma poche des eaux s'est rompue à 29 semaines",
        "I'm in early labor and I'm only 27 weeks",
        "Rupture prématurée des membranes à 28 semaines",
        "My cervix is dilating at 30 weeks already",
        "Waters broke at home at 31 weeks, calling ambulance",
        "Premature labor started tonight, baby isn't ready",
    ],
    "ECTOPIC": [
        "I have an ectopic pregnancy and severe pain",
        "Grossesse extra-utérine découverte en urgence",
        "My tube ruptured from an ectopic pregnancy",
        "Ectopic pregnancy diagnosed today at the ER",
        "Douleur brutale et grossesse ectopique confirmée",
        "I was told my pregnancy is ectopic",
        "Grossesse extra-utérine à 6 semaines, urgence",
        "My ectopic pregnancy ruptured and I'm hemorrhaging",
    ],
    "STILLBIRTH": [
        "We had a stillbirth at 38 weeks",
        "Notre bébé est mort-né à terme",
        "Stillborn baby at full term, we are destroyed",
        "Mort-né à 39 semaines, je suis dévastée",
        "Our baby was stillborn and I can't breathe",
        "We delivered our stillborn son yesterday",
        "My baby stopped moving and was born still",
        "MFIU confirmée, je dois accoucher d'un bébé mort",
    ],
    "POSTPARTUM_CRISIS": [
        "I'm experiencing postpartum psychosis",
        "Severe postpartum depression and I want to hurt my baby",
        "Psychose post-partum diagnostiquée en urgence",
        "I have violent thoughts about my newborn",
        "I'm terrified of what I might do to my baby",
        "Je n'arrive plus à m'occuper de mon bébé, j'ai peur de moi",
        "Psychose puerpérale, hospitalisation psychiatrique",
        "I'm hearing voices since giving birth last week",
        "I feel like a danger to my own child",
        "Envie de faire du mal à mon bébé, je suis terrifiée",
    ],
    "SELF_HARM": [
        "I want to die after losing my baby",
        "I'm thinking about suicide since the miscarriage",
        "Je pense à me faire du mal depuis ma fausse couche",
        "I've been self-harming since the pregnancy loss",
        "Killing myself seems like the only option left",
        "Je veux mourir tellement je souffre depuis la perte",
        "I cut myself last night because of the pain",
        "I don't want to be here anymore after what happened",
        "Suicidal thoughts are getting stronger every day",
        "I have a plan to end my life after this loss",
        "I'm going to hurt myself tonight",
    ],
    "SUBSTANCE_ABUSE": [
        "I've been drinking alcohol during my pregnancy",
        "I'm taking drugs while pregnant and I don't know what to do",
        "I used heroin while pregnant, scared for my baby",
        "I can't stop smoking even though I'm 6 months pregnant",
        "J'ai pris de la drogue pendant le premier trimestre",
        "Je bois tous les jours depuis le début de ma grossesse",
        "I relapsed on cocaine while 5 months pregnant",
        "I'm addicted and pregnant and don't know who to call",
        "Consommation d'alcool pendant toute la grossesse",
    ],
    "MEDICAL_EMERGENCY": [
        "I need an ambulance right now, I'm pregnant and collapsed",
        "Urgence médicale, j'ai perdu connaissance enceinte",
        "I can't breathe and I'm 8 months pregnant",
        "I collapsed and I'm alone with my baby",
        "Je n'arrive plus à respirer, j'appelle le 15",
        "Seizure during pregnancy, call 911",
        "I think I'm having a stroke while pregnant",
        "I'm going into shock after delivery",
        "Choc hémorragique après accouchement",
        "I feel like I'm dying, I'm postpartum",
        "Urgence vitale, femme enceinte à domicile",
    ],
}

SAFE_POSTS = [
    "Today I felt my baby kick for the first time!",
    "Week 20 and feeling amazing, so grateful!",
    "Anyone have recipe ideas for the first trimester nausea?",
    "Just had my ultrasound and everything looks perfect",
    "My pregnancy is going smoothly, baby is healthy and growing",
    "Tips for sleeping comfortably in the third trimester?",
    "Breastfeeding tips for new moms? Any advice welcome",
    "Je suis enceinte de 5 mois et tout va tres bien",
    "Quelle joie d'etre enceinte pour la deuxieme fois!",
    "Mon bebe sourit maintenant c est tellement mignon",
    "Week 32 check-up went great, doctor is so happy",
    "Choosing baby names is so much fun, can't decide!",
    "I just announced my pregnancy to my whole family!",
    "Baby shower planning is in full swing, so excited",
    "Nesting has begun! Decorating the nursery",
    "Birth plan ideas for a natural water delivery",
    "Prenatal yoga has been absolutely life-changing for me",
    "Maternity leave officially started today, happy days!",
    "Hospital bag is packed and ready, just waiting now",
    "I had a wonderful positive birth experience",
    "New mom here loving every single moment",
    "Postpartum recovery going smoothly so far",
    "Baby is sleeping 5 hours straight now, miracle!",
    "First smile from my baby today, melted my heart",
    "Introducing solids at 6 months, any tips?",
    "My midwife appointment went really well today",
    "Glucose tolerance test passed with flying colours",
    "Iron levels back to normal after supplements",
    "We found out the gender today, so thrilled!",
    "I'm writing my birth plan and feeling so prepared",
    "Toddler is excited to become a big brother soon",
    "Baby shower was so beautiful, feeling so loved",
    "One week until my due date, can't wait to meet her!",
    "Allaitement qui se passe a merveille, bebe prend du poids",
    "Mon bebe dort bien la nuit depuis 3 semaines",
    "My newborn had her first bath today, adorable chaos",
    "Baby's first laugh today, it was the best sound ever",
    "Sleep regression at 4 months is real but we're managing",
    "Baby wearing has been amazing for us both",
    # Safe medical context
    "I just came out of the hospital and the doctor said its okay to go to work after giving birth",
    "The doctor said I can return to light work 6 weeks after giving birth",
    "Just got discharged from the hospital after giving birth, everything went smoothly",
    "The doctor said the birth went perfectly and I can go home tomorrow",
    "Just left the hospital after my scheduled C-section, recovery is going well",
    "My doctor said I can start gentle walks 2 weeks after giving birth",
    "Going back to work after maternity leave is emotional. Any tips?",
    "Doctor gave me the all-clear at my 6-week postnatal check",
    "My hospital tour was amazing, the birth suite looked so calm",
    "The doctor at my antenatal appointment was so reassuring and kind",
    "My birth was at the hospital and the team was absolutely wonderful",
    "After giving birth in hospital I recovered really quickly",
    "I just came out of the best prenatal appointment ever, feeling so reassured",
    "I came out of the scan room crying happy tears, everything looks perfect",
    "Is it okay to travel by plane at 28 weeks? My doctor said yes for short flights",
    "My doctor said it is okay to have a small amount of caffeine during pregnancy",
    "The doctor said it is okay to continue swimming throughout my whole pregnancy",
    "My doctor said going back to work at 8 weeks postpartum is fine if I feel ready",
    "I am recovering well after giving birth, resting at home with my newborn",
    "Postpartum recovery takes time. I rested for 6 weeks before going back to work",
    "My postpartum check-up at 6 weeks went really well, doctor is happy with my recovery",
    "I came out of labour and delivery feeling like a total warrior, birth was amazing",
    "Just came home after giving birth, feeling tired but so happy and healthy",
    "Giving birth at the hospital was such a positive and empowering experience for me",
    # Normal bleeding mentions
    "I had some light bleeding early on but my doctor confirmed it was normal implantation",
    "My doctor explained that a tiny bit of spotting after an internal exam is completely normal",
    "Light spotting in early pregnancy can be normal, always call your midwife to check",
    "I had some bleeding at 6 weeks but the scan showed everything was fine",
    "My doctor said the very light spotting I experienced was normal and nothing to worry about",
    # Normal pain mentions
    "I have mild back pain and my physiotherapist gave me great exercises for it",
    "Round ligament pain is very common in the second trimester, totally normal",
    "My doctor said the pelvic girdle pain I'm experiencing is common in pregnancy",
    "Braxton Hicks contractions can feel uncomfortable but they're not real labour",
    "Hip pain while sleeping is so common in the third trimester",
]


def build_dataframe() -> pd.DataFrame:
    records = []
    for category, texts in TRAINING_DATA.items():
        for text in texts:
            records.append({"text": text, "label": category})
    for text in SAFE_POSTS:
        records.append({"text": text, "label": "SAFE"})
    return pd.DataFrame(records)


def train():
    print("=" * 60)
    print("Training harmful content model v3 …")
    print("=" * 60)

    df = build_dataframe()
    print(f"Total samples: {len(df)}")
    print(f"Distribution:\n{df['label'].value_counts()}\n")

    X        = df["text"].tolist()
    y_binary = (df["label"] != "SAFE").astype(int).tolist()
    y_multi  = df["label"].tolist()

    tfidf_cfg = dict(
        ngram_range=(1, 3), max_features=20_000, sublinear_tf=True,
        strip_accents="unicode", analyzer="word",
        token_pattern=r"(?u)\b\w+\b", min_df=1,
    )

    binary_pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(**tfidf_cfg)),
        ("clf",   LogisticRegression(C=2.5, max_iter=2000,
                                     class_weight="balanced", solver="lbfgs")),
    ])

    if len(set(y_binary)) > 1:
        X_tr, X_te, yb_tr, yb_te = train_test_split(
            X, y_binary, test_size=0.2, random_state=42, stratify=y_binary)
        binary_pipeline.fit(X_tr, yb_tr)
        print("── Binary classifier ──────────────────────────────────")
        print(classification_report(yb_te, binary_pipeline.predict(X_te),
                                    target_names=["SAFE", "HARMFUL"]))
    else:
        binary_pipeline.fit(X, y_binary)

    multi_pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(**tfidf_cfg)),
        ("clf",   LogisticRegression(C=2.5, max_iter=2000,
                                     class_weight="balanced", solver="lbfgs",
                                     multi_class="ovr")),
    ])

    if len(set(y_multi)) > 1:
        X_tr2, X_te2, ym_tr, ym_te = train_test_split(
            X, y_multi, test_size=0.2, random_state=42, stratify=y_multi)
        multi_pipeline.fit(X_tr2, ym_tr)
        print("── Multi-class classifier ─────────────────────────────")
        print(classification_report(ym_te, multi_pipeline.predict(X_te2), zero_division=0))
    else:
        multi_pipeline.fit(X, y_multi)

    joblib.dump({
        "binary":     binary_pipeline,
        "multi":      multi_pipeline,
        "labels":     list(HARMFUL_CATEGORIES.keys()),
        "categories": HARMFUL_CATEGORIES,
    }, HARMFUL_MODEL_PATH)
    print(f"\n✅  Model saved → {HARMFUL_MODEL_PATH}")
    print("=" * 60)


if __name__ == "__main__":
    train()