import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-phase-predictor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

    :root {
      --rose:        #c94d6a;
      --rose-light:  #f5c6d0;
      --peach:       #d97b58;
      --gold:        #a8722e;
      --cream:       #f7ede4;
      --text-dark:   #1e1215;
      --text-mid:    #4a3038;
      --text-soft:   #7a5c65;
      --font-display: 'Cormorant Garamond', Georgia, serif;
      --font-body:    'DM Sans', sans-serif;
    }

    :host { display: block; font-family: var(--font-body); }

    .page {
      min-height: 100vh; position: relative;
    }
    .page::before {
      content: '';
      position: fixed; inset: 0;
      background-image: url('/assets/img/mother_pages_background-3.png');
      background-size: cover; background-position: center; z-index: -1;
    }
    .page::after {
      content: '';
      position: fixed; inset: 0;
      background: rgba(247,237,228,0.85); z-index: -1;
    }

    .wrap {
      position: relative; z-index: 1;
      max-width: 1400px; margin: 0 auto;
      padding: 3rem 1.5rem 5rem;
    }

    /* ── HERO ── */
    .hero {
      border-radius: 28px;
      background: linear-gradient(150deg, #1e1215 0%, #3d1a28 60%, #5c2038 100%);
      padding: 3rem;
      margin-bottom: 2rem;
      position: relative; overflow: hidden;
      text-align: center;
    }
    .hero::before {
      content: '🧬';
      position: absolute;
      left: -20px; top: -20px;
      font-size: 180px; opacity: 0.05;
      line-height: 1;
    }
    .hero::after {
      content: '🧬';
      position: absolute;
      right: -20px; bottom: -20px;
      font-size: 180px; opacity: 0.05;
      line-height: 1;
      transform: scaleX(-1);
    }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(201,77,106,0.25);
      border: 1px solid rgba(201,77,106,0.4);
      color: var(--rose-light);
      font-size: 0.72rem; font-weight: 600;
      letter-spacing: 0.12em; text-transform: uppercase;
      padding: 5px 14px; border-radius: 20px;
      margin-bottom: 1rem; position: relative; z-index: 1;
    }
    .hero h1 {
      font-family: var(--font-display);
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 700; color: white;
      line-height: 1.15; margin-bottom: 10px;
      position: relative; z-index: 1;
    }
    .hero h1 em { font-style: italic; color: var(--rose-light); }
    .hero p {
      font-size: 0.9rem; color: rgba(255,255,255,0.55);
      line-height: 1.7; margin-bottom: 1.5rem;
      position: relative; z-index: 1;
    }
    .accuracy-pill {
      display: inline-flex; align-items: center; gap: 10px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 30px; padding: 8px 20px;
      position: relative; z-index: 1;
    }
    .acc-num {
      font-family: var(--font-display);
      font-size: 1.4rem; font-weight: 700; color: white;
    }
    .acc-lbl { font-size: 0.72rem; color: rgba(255,255,255,0.6); font-weight: 500; }

    /* Info tiles in hero */
    .hero-tiles {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 10px; margin-top: 1.5rem;
      position: relative; z-index: 1;
    }
    .hero-tile {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 14px; padding: 14px 10px; text-align: center;
    }
    .tile-icon { font-size: 22px; display: block; margin-bottom: 6px; }
    .tile-lbl { font-size: 0.72rem; color: rgba(255,255,255,0.6); font-weight: 500; }
    .tile-val { font-size: 0.9rem; font-weight: 700; color: white; margin-top: 2px; }

    /* Form card */
    .form-card {
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: 24px; padding: 2rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 16px rgba(30,18,21,0.08);
    }
    .card-header-row {
      display: flex; align-items: center;
      justify-content: space-between; margin-bottom: 1.5rem;
    }
    .card-title {
      font-family: var(--font-display);
      font-size: 1.3rem; font-weight: 700; color: var(--text-dark);
    }
    .bmi-chip {
      background: var(--cream);
      border: 1.5px solid rgba(201,77,106,0.2);
      border-radius: 20px; padding: 6px 14px;
      font-size: 0.78rem; font-weight: 600;
      color: var(--text-mid); white-space: nowrap;
    }
    .bmi-chip strong { color: var(--rose); }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field.full { grid-column: 1/-1; }
    .field label {
      font-size: 0.72rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--text-soft);
    }
    .field input, .field select {
      padding: 11px 14px; border-radius: 10px;
      border: 1.5px solid rgba(201,77,106,0.2);
      background: var(--cream);
      color: var(--text-dark); font-size: 0.9rem;
      font-family: var(--font-body); outline: none;
      transition: border-color 0.2s;
    }
    .field input:focus, .field select:focus { border-color: var(--rose); background: white; }

    .predict-btn {
      width: 100%; margin-top: 1.25rem;
      padding: 15px; border-radius: 14px; border: none;
      background: linear-gradient(135deg, #e8436c, #c94d6a);
      color: white; font-size: 0.95rem; font-weight: 700;
      font-family: var(--font-body);
      cursor: pointer; transition: all 0.2s;
      letter-spacing: 0.03em;
      box-shadow: 0 4px 16px rgba(201,77,106,0.3);
    }
    .predict-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(201,77,106,0.4); }
    .predict-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Results */
    .result-hero {
      border-radius: 24px; padding: 2.5rem 2rem;
      text-align: center; margin-bottom: 1.5rem;
      border: 2px solid; animation: resultIn 0.5s ease both;
    }
    @keyframes resultIn {
      from { opacity: 0; transform: scale(0.95); }
      to   { opacity: 1; transform: scale(1); }
    }
    .result-emoji { font-size: 72px; display: block; margin-bottom: 12px; }
    .result-risk  { font-family: var(--font-display); font-size: 2.5rem; font-weight: 700; margin-bottom: 6px; }
    .result-conf  { font-size: 0.82rem; opacity: 0.65; margin-bottom: 12px; }
    .result-msg   { font-size: 0.9rem; line-height: 1.7; margin-bottom: 1rem; }
    .advice-list { list-style: none; padding: 0; text-align: left; }
    .advice-list li {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 5px 0; font-size: 0.85rem;
      border-bottom: 1px solid rgba(0,0,0,0.05);
    }
    .advice-list li:last-child { border: none; }

    /* Results cards */
    .results-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
    .result-card {
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: 20px; padding: 1.5rem;
      box-shadow: 0 2px 16px rgba(30,18,21,0.06);
    }
    .result-card-title {
      font-family: var(--font-display);
      font-size: 1rem; font-weight: 700;
      color: var(--text-dark); margin-bottom: 1rem;
    }

    /* Probabilities */
    .proba-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .proba-lbl { font-size: 0.72rem; font-weight: 600; color: var(--text-mid); width: 65px; flex-shrink: 0; }
    .proba-track { flex: 1; height: 8px; background: var(--cream); border-radius: 4px; overflow: hidden; }
    .proba-fill { height: 100%; border-radius: 4px; transition: width 0.8s ease; }
    .proba-pct { font-size: 0.72rem; font-weight: 700; color: var(--text-mid); width: 34px; text-align: right; }

    /* Factors */
    .factor-item {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 6px 0; font-size: 0.82rem; color: var(--text-mid);
      border-bottom: 1px solid rgba(201,77,106,0.08);
    }
    .factor-item:last-child { border: none; }

    @media (max-width: 600px) {
      .wrap { padding: 1.5rem 1rem 3rem; }
      .form-grid { grid-template-columns: 1fr; }
      .results-row { grid-template-columns: 1fr; }
      .hero-tiles { grid-template-columns: 1fr; }
    }
  `],
  template: `
    <div class="page">
      <div class="wrap">

        <!-- HERO -->
        <div class="hero">
          <div class="hero-badge">🤖 Intelligence Artificielle</div>
          <h1>Analyse de<br /><em>Risque Prénatal</em> IA</h1>
          <p>Notre modèle de machine learning analyse votre profil médical pour prédire votre niveau de risque avec une précision clinique.</p>
          <div class="accuracy-pill">
            <span class="acc-num">96.9%</span>
            <span class="acc-lbl">Précision du modèle · Testé sur 12 000+ profils</span>
          </div>
          <div class="hero-tiles">
            <div class="hero-tile">
              <span class="tile-icon">🔬</span>
              <div class="tile-lbl">Paramètres analysés</div>
              <div class="tile-val">8+</div>
            </div>
            <div class="hero-tile">
              <span class="tile-icon">⚡</span>
              <div class="tile-lbl">Résultat en</div>
              <div class="tile-val">< 2 sec</div>
            </div>
            <div class="hero-tile">
              <span class="tile-icon">🩺</span>
              <div class="tile-lbl">Niveaux de risque</div>
              <div class="tile-val">3 niveaux</div>
            </div>
          </div>
        </div>

        <!-- FORM -->
        <div class="form-card">
          <div class="card-header-row">
            <div class="card-title">📋 Votre profil médical</div>
            @if (form.weight_kg && form.height_cm) {
              <div class="bmi-chip">
                IMC : <strong>{{ calcBmi() }}</strong> · {{ getBmiStatus() }}
              </div>
            }
          </div>

          <div class="form-grid">
            <div class="field">
              <label>Âge</label>
              <input type="number" [(ngModel)]="form.age" placeholder="Ex: 28" min="14" max="50" />
            </div>
            <div class="field">
              <label>Poids (kg)</label>
              <input type="number" [(ngModel)]="form.weight_kg" placeholder="Ex: 65" />
            </div>
            <div class="field">
              <label>Taille (cm)</label>
              <input type="number" [(ngModel)]="form.height_cm" placeholder="Ex: 165" />
            </div>
            <div class="field">
              <label>Groupe sanguin</label>
              <select [(ngModel)]="form.blood_type">
                <option value="">— Sélectionner —</option>
                @for (bt of bloodTypes; track bt) {
                  <option [value]="bt">{{ bt }}</option>
                }
              </select>
            </div>
            <div class="field full">
              <label>Antécédents médicaux</label>
              <select [(ngModel)]="form.medical_history">
                <option value="aucun">✅ Aucun antécédent</option>
                <option value="diabete">🍬 Diabète</option>
                <option value="hypertension">❤️ Hypertension</option>
                <option value="diabete_hypertension">⚠️ Diabète + Hypertension</option>
              </select>
            </div>
          </div>

          <button class="predict-btn" (click)="predict()" [disabled]="loading || !isValid()">
            {{ loading ? '⏳ Analyse en cours...' : '🧬 Lancer l\'analyse IA' }}
          </button>
        </div>

        <!-- RESULTS -->
        @if (result) {

          <div class="result-hero"
               [style.border-color]="result.color"
               [style.background]="result.color + '14'">
            <span class="result-emoji">{{ result.emoji }}</span>
            <div class="result-risk" [style.color]="result.color">{{ result.risk_label }}</div>
            <div class="result-conf">Confiance du modèle : {{ result.confidence }}%</div>
            <div class="result-msg">{{ result.message }}</div>
            @if (result.advice?.length > 0) {
              <ul class="advice-list">
                @for (a of result.advice; track a) {
                  <li><span>✅</span><span>{{ a }}</span></li>
                }
              </ul>
            }
          </div>

          <div class="results-row">

            <div class="result-card">
              <div class="result-card-title">📊 Probabilités</div>
              @for (p of getProbabilities(); track p.risk) {
                <div class="proba-row">
                  <span class="proba-lbl">{{ p.risk }}</span>
                  <div class="proba-track">
                    <div class="proba-fill"
                         [style.width]="(p.value*100)+'%'"
                         [style.background]="riskColors[p.risk]"></div>
                  </div>
                  <span class="proba-pct">{{ (p.value*100).toFixed(0) }}%</span>
                </div>
              }
            </div>

            <div class="result-card">
              <div class="result-card-title">⚠️ Facteurs identifiés</div>
              @for (f of result.risk_factors; track f) {
                <div class="factor-item">
                  <span>{{ f.includes('Aucun') ? '✅' : '⚠️' }}</span>
                  <span>{{ f }}</span>
                </div>
              }
            </div>

          </div>
        }

      </div>
    </div>
  `
})
export class PhasePredictorComponent implements OnInit {
  loading = false;
  result: any = null;

  form = {
    age: null as any,
    weight_kg: null as any,
    height_cm: null as any,
    blood_type: '',
    medical_history: 'aucun'
  };

  bloodTypes = ['A_POS','A_NEG','B_POS','B_NEG','AB_POS','AB_NEG','O_POS','O_NEG'];
  riskColors: Record<string,string> = { FAIBLE:'#10b981', MOYEN:'#f59e0b', ELEVE:'#ef4444' };

  constructor(private http: HttpClient, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/users/me/health-profile`).subscribe({
      next: (res) => {
        if (res?.data) {
          this.form.age        = res.data.age;
          this.form.weight_kg  = res.data.weightKg;
          this.form.height_cm  = res.data.heightCm;
          this.form.blood_type = (res.data.bloodType || '').replace('-','_');
          const hist = res.data.medicalHistoryJson || '';
          const hasDiab = hist.includes('diabet'), hasHype = hist.includes('hypertension');
          if (hasDiab && hasHype) this.form.medical_history = 'diabete_hypertension';
          else if (hasDiab)       this.form.medical_history = 'diabete';
          else if (hasHype)       this.form.medical_history = 'hypertension';
          else                    this.form.medical_history = 'aucun';
        }
      }
    });
  }

  isValid(): boolean { return !!(this.form.age && this.form.weight_kg && this.form.height_cm && this.form.blood_type); }

  calcBmi(): string {
    if (!this.form.weight_kg || !this.form.height_cm) return '--';
    return (this.form.weight_kg / ((this.form.height_cm/100)**2)).toFixed(1);
  }

  getBmiStatus(): string {
    const b = parseFloat(this.calcBmi());
    if (isNaN(b)) return '';
    return b < 18.5 ? 'Insuffisance pondérale' : b < 25 ? 'Normal ✅' : b < 30 ? 'Surpoids' : 'Obésité';
  }

  predict(): void {
    if (!this.isValid()) return;
    this.loading = true; this.result = null;
    this.http.post<any>(`${environment.apiUrl}/ml/predict-phase`, this.form).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.data) this.result = res.data;
        else this.snack.open('Erreur de prédiction', 'OK', { duration: 3000 });
      },
      error: () => {
        this.loading = false;
        this.snack.open('Service ML indisponible — lancez python app.py', 'OK', { duration: 4000 });
      }
    });
  }

  getProbabilities(): {risk:string; value:number}[] {
    if (!this.result?.probabilities) return [];
    return Object.entries(this.result.probabilities)
      .map(([risk, value]:any) => ({risk, value}))
      .sort((a,b) => b.value - a.value);
  }
}