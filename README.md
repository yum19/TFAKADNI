<div align="center">

<img src="assets/logo.png" alt="TFAKADNI logo" width="160"/>

# TFAKADNI

> **From the first cycle to the first cradle.**
> An AI-powered maternal health platform for Tunisia and the MENA region: one account, one continuous journey, from premarital health to baby's first year.

**Team:** The 7th Layer · ESPRIT · PI-CDIO · May 2026

</div>

---

## 1. Why TFAKADNI

1.2M Tunisian women aged 15–49 have no culturally adapted digital support. Today they juggle five disconnected apps (cycle, pregnancy, baby, community, doctor), none in Tunisian Arabic.

| Problem | Our answer |
|---|---|
| **Late**: risks are caught at the hospital, not at home | Proactive AI risk monitoring |
| **Alone**: the partner is a guest | EvoCare, a consent-based partner module |
| **Foreign**: no local language or payment | Arabic / Tunisian / French UI, Konnect TND |

## 2. Features: one platform, seven stages

```mermaid
flowchart LR
    S1["1. Cycle & Fertility<br/>AI tracking, ovulation,<br/>Genetic Oracle"] --> S2["2. Pregnancy<br/>risk monitoring,<br/>smart visits"]
    S2 --> S3["3. Postpartum<br/>PHQ-10, voice journal,<br/>psychiatrist"]
    S3 --> S5["5. Baby Year 1<br/>feed/sleep logs,<br/>daily Care Score"]
    S4["4. EvoCare (Partner)<br/>14 weekly tasks,<br/>consent-based access"] -. supports .-> S2
    S4 -. supports .-> S3
    S6["6. Community & Market<br/>AR + FR, Konnect TND"] -. all stages .- S2
    S7["7. Nutrition & Exercise<br/>meal plans, activity,<br/>wellness"] -. all stages .- S2
```

Key differentiators: end-to-end journey, Tunisian-first design, **96.9% accuracy** risk model (trained on 12,000 Tunisian mother profiles), partner-inclusive, proactive AI (Cycle Twin, Baby Rhythm, Care Score), multi-AI stack.

## 3. Screenshots

<table>
  <tr>
    <td align="center" width="50%">
      <img src="assets/screenshot-home.png" alt="Home page with voice commands and accessibility panel"/>
      <br/><b>Home</b> · welcome page with voice-command accessibility panel
    </td>
    <td align="center" width="50%">
      <img src="assets/screenshot-cycle.png" alt="Cycle tracker"/>
      <br/><b>Cycle tracker</b> · phases, statistics and next-cycle prediction
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="assets/screenshot-pregnancy.png" alt="My Pregnancy journey page"/>
      <br/><b>My Pregnancy</b> · weekly journey, risk score and partner sharing
    </td>
    <td align="center" width="50%">
      <img src="assets/screenshot-partner.png" alt="Partner support notes"/>
      <br/><b>EvoCare (Partner)</b> · support notes between partners
    </td>
  </tr>
</table>

## 4. Actors

| Actor | Role |
|---|---|
| **Mother / Woman** | Main user. Owns her health data across all stages |
| **Partner** | Uses EvoCare, sees only what the mother consents to |
| **Doctor / Psychiatrist** | Receives alerts, follows up on risk and postpartum screening |
| **Administrator** | Manages users, content, clinical protocols and marketplace |
| **DevOps team** | Deploys, scales and monitors the platform |
| **External systems** | Claude, Gemini 2.5, Whisper (AI) · Konnect TND, Stripe (payments) |

```mermaid
flowchart LR
    M([Mother])
    P([Partner])
    D([Doctor / Psychiatrist])
    A([Administrator])
    O([DevOps])

    subgraph TFAKADNI
        U1(Track cycle & fertility)
        U2(Monitor pregnancy risk)
        U3(Postpartum screening & voice journal)
        U4(Track baby: feed, sleep, Care Score)
        U5(Community & marketplace)
        U6(Nutrition & exercise plans)
        U7(Grant / revoke partner consent)
        U8(Complete EvoCare tasks)
        U9(Review alerts & patients)
        U10(Manage users, content, protocols)
        U11(Deploy & monitor)
    end

    M --> U1 & U2 & U3 & U4 & U5 & U6 & U7
    P --> U8
    P --> U5
    D --> U9
    A --> U10
    O --> U11
    U8 -. requires .-> U7
```

## 5. Architecture

```mermaid
flowchart TB
    Users["Mother · Partner · Doctor · Admin"] -->|HTTPS| FE["Angular frontend<br/>bilingual UI AR / AN / FR"]
    FE -->|REST + WebSocket<br/>OAuth 2.0 · JWT · TOTP| GW["Spring Boot API<br/>business logic, auth, roles"]
    GW --> DB[("MySQL")]
    GW -->|inference| ML["FastAPI (Python)<br/>AI services"]

    subgraph AI["AI layer"]
        ML --> RISK["Custom GB + RF risk model<br/>Bayesian fertility engine"]
        ML --> CL["Claude (reasoning)"]
        ML --> GM["Gemini 2.5 (multimodal)"]
        ML --> WH["Whisper (voice)"]
    end

    GW --> PAY["Konnect TND · Stripe"]
    MLF["MLflow · Hugging Face"] --> ML
```

## 6. Cloud infrastructure & CI/CD

Multi-region, auto-scaling (100 → 1M+ users), end-to-end encryption, GDPR-aligned, role-based access, local data residency (Tunisia → Maghreb → MENA).

```mermaid
flowchart LR
    Dev["Developer"] -->|PR| GH["GitHub"]
    GH --> CI["GitHub Actions<br/>build · test"]
    CI --> REG["Docker images"]
    REG --> K8S

    subgraph OS["OpenStack"]
        subgraph K8S["Kubernetes cluster"]
            FEP["Angular pod"]
            BEP["Spring Boot pod"]
            AIP["FastAPI pod"]
            DBP[("MySQL")]
        end
    end

    ANS["Ansible"] -->|configures| K8S
    K8S -->|metrics| PROM["Prometheus"]
    PROM --> ALERT["Alertmanager<br/>(auto-remediation)"]
```

## 7. Example flow: pregnancy risk alert

```mermaid
sequenceDiagram
    actor M as Mother
    participant FE as Angular
    participant API as Spring Boot
    participant AI as FastAPI + risk model
    actor D as Doctor
    actor P as Partner

    M->>FE: Log symptoms / vitals
    FE->>API: POST /api/pregnancy/entries (JWT)
    API->>AI: Request risk score
    AI-->>API: Risk level + explanation
    API-->>FE: Result shown in real time (WebSocket)
    alt High risk
        API->>D: Alert
        API->>P: Notification (only if consent granted)
    end
```

## 8. Tech stack

| Area | Technologies |
|---|---|
| Frontend | Angular, bilingual UI (AR / AN / FR) |
| Backend | Spring Boot, FastAPI (Python), REST + WebSocket |
| Database | MySQL |
| AI / ML | Claude, Gemini 2.5, Whisper, GB+RF risk model, Bayesian fertility engine, MLflow, Hugging Face |
| Payment & auth | Konnect TND, Stripe, OAuth 2.0 + JWT, TOTP 2FA |
| Cloud & DevOps | OpenStack, Docker, Kubernetes, Ansible, GitHub Actions, Prometheus, Alertmanager |
| Clinical sources | 9 validated sources (incl. ACOG, ESHRE) |

## 9. SDGs

SDG 3 Good Health · SDG 4 Education · SDG 5 Gender Equality · SDG 9 Innovation · SDG 10 Reduced Inequalities · SDG 17 Partnerships

## 10. Roadmap

**Pilot:** 3 hospitals · 500 mothers · 12 months, then Maghreb → MENA → Francophone Africa.

## 11. Project structure

```
.
├── assets/     # README images
├── frontend/   # Angular app
└── backend/    # Spring Boot app
```

## 12. Getting started

```bash
git clone <REPO_URL>
cd <REPO_FOLDER>

# Frontend  (http://localhost:4200)
cd frontend && npm install && ng serve

# Backend
cd backend && ./mvnw spring-boot:run
```

## 13. Git workflow

```bash
git checkout -b your-name/feature-name        # e.g. missaoui/module-7
git checkout main && git pull origin main     # sync
git checkout your-name/feature-name && git merge main
git status && git add . && git commit -m "your commit message"
git push -u origin your-name/feature-name     # first time, then: git push
```

**Rules**

- Never work directly on `main`
- Always use your own branch
- Pull the latest `main` before starting new work
- Write clear commit messages
- Push your branch, then open a Pull Request on GitHub
