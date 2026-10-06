import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-medical-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule,
            MatProgressSpinnerModule, MatSnackBarModule, RouterModule],
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
      min-height: 100vh;
      position: relative;
      background: var(--cream);
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
      max-width: 1400px;
      margin: 0 auto;
      padding: 3rem 1.5rem 5rem;
    }

    /* ── PAGE HEADER ── */
    .page-header {
      display: flex; align-items: flex-start;
      justify-content: space-between; gap: 1rem;
      margin-bottom: 2.5rem;
    }
    .header-badge {
      display: inline-block;
      font-size: 0.72rem; font-weight: 600;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--rose); background: var(--rose-light);
      padding: 4px 14px; border-radius: 20px;
      border: 1.5px solid rgba(201,77,106,0.25);
      margin-bottom: 10px;
    }
    .page-title {
      font-family: var(--font-display);
      font-size: clamp(1.8rem, 3vw, 2.5rem);
      font-weight: 700; color: var(--text-dark);
      line-height: 1.2; margin-bottom: 6px;
    }
    .page-title em { font-style: italic; color: var(--rose); }
    .page-sub { font-size: 0.88rem; color: var(--text-soft); line-height: 1.6; }

    /* ── LOADING ── */
    .loading-wrap {
      display: flex; flex-direction: column;
      align-items: center; padding: 5rem;
      color: var(--text-soft);
    }

    /* ── EMPTY STATE ── */
    .empty-state {
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: 28px;
      padding: 4rem;
      text-align: center;
      box-shadow: 0 2px 16px rgba(30,18,21,0.08);
    }
    .empty-icon { font-size: 64px; display: block; margin-bottom: 1rem; }
    .empty-title { font-family: var(--font-display); font-size: 1.6rem; font-weight: 700; color: var(--text-dark); margin-bottom: 8px; }
    .empty-sub { font-size: 0.9rem; color: var(--text-soft); margin-bottom: 1.5rem; line-height: 1.6; }
    .btn-fill {
      display: inline-block;
      background: linear-gradient(135deg, #e8436c, #c94d6a);
      color: white; padding: 12px 28px;
      border-radius: 14px; text-decoration: none;
      font-weight: 600; font-size: 0.9rem;
      box-shadow: 0 4px 16px rgba(201,77,106,0.3);
    }

    /* ── MEDICAL CARD ── */
    .medical-card {
      background: white;
      border-radius: 28px;
      overflow: hidden;
      margin-bottom: 1.5rem;
      box-shadow: 0 8px 48px rgba(30,18,21,0.15);
      animation: cardAppear 0.5s ease both;
    }
    @keyframes cardAppear {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Card header */
    .card-header {
      background: linear-gradient(135deg, #1e1215 0%, #3d1a28 60%, #5c2038 100%);
      padding: 1.8rem 2rem;
      display: flex; align-items: center;
      justify-content: space-between;
      position: relative; overflow: hidden;
    }
    .card-header::after {
      content: '🤟';
      position: absolute;
      right: -10px; top: 50%;
      transform: translateY(-50%);
      font-size: 120px; opacity: 0.07;
    }
    .card-logo-wrap {
      display: flex; align-items: center; gap: 14px;
    }
    .card-logo {
      width: 52px; height: 52px; border-radius: 16px;
      background: rgba(255,255,255,0.12);
      border: 2px solid rgba(255,255,255,0.2);
      display: flex; align-items: center;
      justify-content: center; font-size: 26px;
    }
    .card-brand { color: white; }
    .brand-name { font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; letter-spacing: 0.05em; }
    .brand-sub  { font-size: 0.72rem; color: rgba(255,255,255,0.55); font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; }
    .card-chip {
      background: rgba(255,255,255,0.12);
      border: 1.5px solid rgba(255,255,255,0.2);
      border-radius: 12px; padding: 8px 16px;
      color: rgba(255,255,255,0.8);
      font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.1em; text-transform: uppercase;
      position: relative; z-index: 1;
    }

    /* Identity band */
    .identity-band {
      background: linear-gradient(90deg, #fff0f5 0%, white 100%);
      padding: 1.5rem 2rem;
      display: flex; align-items: center;
      gap: 1.25rem;
      border-bottom: 1.5px solid #fde8ee;
    }
    .patient-avatar {
      width: 72px; height: 72px; border-radius: 50%;
      border: 3px solid var(--rose);
      object-fit: cover; flex-shrink: 0;
    }
    .patient-placeholder {
      width: 72px; height: 72px; border-radius: 50%;
      border: 3px solid var(--rose);
      background: var(--rose-light);
      display: flex; align-items: center;
      justify-content: center; font-size: 32px;
      flex-shrink: 0;
    }
    .patient-name {
      font-family: var(--font-display);
      font-size: 1.5rem; font-weight: 700;
      color: var(--text-dark); margin-bottom: 4px;
    }
    .patient-note {
      font-size: 0.82rem; color: var(--text-soft);
      line-height: 1.5;
    }
    .patient-email {
      font-size: 0.82rem; font-weight: 600;
      color: var(--rose); margin-top: 3px;
    }
    .deaf-tag {
      margin-left: auto;
      background: linear-gradient(135deg, #fff0f5, #fce4ec);
      border: 2px solid rgba(201,77,106,0.3);
      border-radius: 14px;
      padding: 10px 14px;
      text-align: center;
      flex-shrink: 0;
    }
    .deaf-tag .icon { font-size: 28px; display: block; }
    .deaf-tag .lbl  { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--rose); font-weight: 700; margin-top: 2px; }

    /* Card body */
    .card-body { padding: 1.8rem 2rem; }

    .section-label {
      font-size: 0.65rem; font-weight: 700;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--rose); margin-bottom: 12px;
      display: flex; align-items: center; gap: 8px;
    }
    .section-label::after {
      content: '';
      flex: 1; height: 1px;
      background: linear-gradient(90deg, rgba(201,77,106,0.25), transparent);
    }

    /* Health stats */
    .stats-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 10px; margin-bottom: 1.5rem;
    }
    .stat-item {
      background: var(--cream);
      border-radius: 14px; padding: 12px;
      text-align: center;
      border: 1px solid rgba(201,77,106,0.12);
    }
    .stat-val { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: var(--rose); display: block; }
    .stat-lbl { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-soft); font-weight: 600; margin-top: 3px; display: block; }

    /* BMI */
    .bmi-bar {
      background: var(--cream);
      border-radius: 14px; padding: 14px 18px;
      display: flex; align-items: center; gap: 14px;
      margin-bottom: 1.5rem;
      border: 1px solid rgba(201,77,106,0.12);
    }
    .bmi-icon { font-size: 24px; }
    .bmi-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-soft); }
    .bmi-val   { font-size: 1rem; font-weight: 700; color: var(--text-dark); }
    .bmi-status { font-size: 0.78rem; color: var(--rose); font-weight: 600; }

    /* History */
    .history-box {
      background: #fff8f9;
      border: 1.5px solid rgba(201,77,106,0.15);
      border-radius: 14px; padding: 14px 18px;
      margin-bottom: 1.5rem;
    }
    .history-text { font-size: 0.88rem; color: var(--text-mid); line-height: 1.6; }

    /* Quick messages */
    .msgs-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 8px; margin-bottom: 0;
    }
    .quick-msg {
      border-radius: 12px; padding: 10px 14px;
      display: flex; align-items: center;
      gap: 10px; border: 1.5px solid;
    }
    .quick-msg.red    { background: #fff5f5; border-color: #fca5a5; color: #991b1b; }
    .quick-msg.orange { background: #fffbeb; border-color: #fcd34d; color: #92400e; }
    .quick-msg.blue   { background: #eff6ff; border-color: #93c5fd; color: #1e40af; }
    .quick-msg.green  { background: #f0fdf4; border-color: #86efac; color: #166534; }
    .quick-msg.purple { background: #faf5ff; border-color: #c4b5fd; color: #5b21b6; }
    .quick-msg.pink   { background: #fff0f5; border-color: #f9a8d4; color: #9d174d; }
    .msg-icon { font-size: 22px; flex-shrink: 0; }
    .msg-text { font-size: 0.78rem; font-weight: 600; line-height: 1.3; }

    /* Card footer */
    .card-footer {
      background: #f8f3f5;
      border-top: 1.5px solid #fde8ee;
      padding: 14px 2rem;
      display: flex; align-items: center;
      justify-content: space-between;
    }
    .footer-meta { font-size: 0.72rem; color: var(--text-soft); line-height: 1.6; }
    .sos-badge {
      background: linear-gradient(135deg, #e8436c, #c94d6a);
      color: white; border-radius: 10px;
      padding: 8px 18px; font-size: 0.78rem;
      font-weight: 700; letter-spacing: 0.05em;
      display: flex; align-items: center; gap: 6px;
      box-shadow: 0 3px 12px rgba(201,77,106,0.3);
    }

    /* Actions */
    .actions {
      display: flex; gap: 10px; margin-bottom: 1.5rem;
    }
    .btn-print {
      flex: 1; padding: 14px;
      background: linear-gradient(135deg, #e8436c, #c94d6a);
      color: white; border: none; border-radius: 14px;
      font-size: 0.9rem; font-weight: 600;
      font-family: var(--font-body);
      cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center;
      justify-content: center; gap: 8px;
      box-shadow: 0 4px 16px rgba(201,77,106,0.3);
    }
    .btn-print:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(201,77,106,0.4); }
    .btn-share {
      flex: 1; padding: 14px;
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(8px);
      color: var(--rose);
      border: 1.5px solid rgba(201,77,106,0.3);
      border-radius: 14px;
      font-size: 0.9rem; font-weight: 600;
      font-family: var(--font-body);
      cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center;
      justify-content: center; gap: 8px;
    }
    .btn-share:hover { background: var(--rose); color: white; }

    /* Tip */
    .tip-box {
      background: rgba(255,255,255,0.7);
      backdrop-filter: blur(8px);
      border: 1.5px solid rgba(201,77,106,0.15);
      border-radius: 14px;
      padding: 14px 18px;
      font-size: 0.82rem;
      color: var(--text-soft);
      line-height: 1.6;
    }

    @media (max-width: 600px) {
      .wrap { padding: 1.5rem 1rem 3rem; }
      .stats-grid { grid-template-columns: repeat(2,1fr); }
      .msgs-grid  { grid-template-columns: 1fr; }
      .identity-band { flex-wrap: wrap; }
      .deaf-tag { margin-left: 0; }
    }
  `],
  template: `
    <div class="page">
      <div class="wrap">

        <!-- Header -->
        <div class="page-header">
          <div>
            <div class="header-badge">🏥 Carte de Soin</div>
            <h1 class="page-title">Carte de<br /><em>Communication</em> Médicale</h1>
            <p class="page-sub">Montrez cette carte à votre médecin ou infirmière lors de votre consultation.</p>
          </div>
        </div>

        <!-- Loading -->
        @if (loading) {
          <div class="loading-wrap">
            <mat-spinner diameter="44" style="margin-bottom:1rem"></mat-spinner>
            <p>Génération de votre carte personnalisée...</p>
          </div>
        }

        <!-- Empty -->
        @if (!loading && !healthProfile) {
          <div class="empty-state">
            <span class="empty-icon">💗</span>
            <h3 class="empty-title">Profil santé non renseigné</h3>
            <p class="empty-sub">Complétez votre profil santé pour générer votre carte médicale personnalisée avec toutes vos informations essentielles.</p>
            <a routerLink="/app/health-profile" class="btn-fill">Compléter mon profil santé →</a>
          </div>
        }

        @if (!loading && healthProfile) {

          <!-- MEDICAL CARD -->
          <div class="medical-card" id="medicalCard">

            <!-- Header -->
            <div class="card-header">
              <div class="card-logo-wrap">
                <div class="card-logo">💗</div>
                <div class="card-brand">
                  <div class="brand-name">MAMAAI</div>
                  <div class="brand-sub">Carte de Communication Médicale</div>
                </div>
              </div>
              <div class="card-chip">Je suis Sourde/Muette 🤟</div>
            </div>

            <!-- Identity -->
            <div class="identity-band">
              @if (user?.avatarUrl) {
                <img [src]="user.avatarUrl" class="patient-avatar" alt="Photo" />
              } @else {
                <div class="patient-placeholder">👤</div>
              }
              <div style="flex:1">
                <div class="patient-name">{{ user?.firstName }} {{ user?.lastName }}</div>
                <div class="patient-note">⚕️ Merci de communiquer par écrit ou par gestes</div>
                <div class="patient-email">📧 {{ user?.email }}</div>
              </div>
              <div class="deaf-tag">
                <span class="icon">🤟</span>
                <span class="lbl">LSF</span>
              </div>
            </div>

            <!-- Body -->
            <div class="card-body">

              <div class="section-label">📊 Données médicales</div>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-val">{{ healthProfile.age || '—' }}</span>
                  <span class="stat-lbl">Âge</span>
                </div>
                <div class="stat-item">
                  <span class="stat-val">{{ healthProfile.weightKg || '—' }}</span>
                  <span class="stat-lbl">Poids (kg)</span>
                </div>
                <div class="stat-item">
                  <span class="stat-val">{{ healthProfile.heightCm || '—' }}</span>
                  <span class="stat-lbl">Taille (cm)</span>
                </div>
                <div class="stat-item">
                  <span class="stat-val" style="font-size:1.1rem">{{ healthProfile.bloodType || '—' }}</span>
                  <span class="stat-lbl">Groupe sanguin</span>
                </div>
              </div>

              @if (bmi) {
                <div class="bmi-bar">
                  <span class="bmi-icon">⚖️</span>
                  <div>
                    <div class="bmi-label">Indice de Masse Corporelle</div>
                    <div style="display:flex;align-items:baseline;gap:10px">
                      <span class="bmi-val">{{ bmi }}</span>
                      <span class="bmi-status">{{ bmiLabel }}</span>
                    </div>
                  </div>
                </div>
              }

              @if (healthProfile.medicalHistoryJson) {
                <div class="section-label">🩺 Antécédents médicaux</div>
                <div class="history-box">
                  <div class="history-text">{{ healthProfile.medicalHistoryJson }}</div>
                </div>
              }

              <div class="section-label">🆘 Messages de communication rapide</div>
              <div class="msgs-grid">
                <div class="quick-msg red">
                  <span class="msg-icon">😣</span>
                  <span class="msg-text">J'ai mal — Douleur intense</span>
                </div>
                <div class="quick-msg orange">
                  <span class="msg-icon">🤰</span>
                  <span class="msg-text">Contractions — Bébé arrive</span>
                </div>
                <div class="quick-msg blue">
                  <span class="msg-icon">🤲</span>
                  <span class="msg-text">Je ne peux pas parler — Écrivez SVP</span>
                </div>
                <div class="quick-msg green">
                  <span class="msg-icon">📞</span>
                  <span class="msg-text">Appelez mon médecin référent</span>
                </div>
                <div class="quick-msg purple">
                  <span class="msg-icon">💊</span>
                  <span class="msg-text">Allergie médicamenteuse — Voir dossier</span>
                </div>
                <div class="quick-msg pink">
                  <span class="msg-icon">🆘</span>
                  <span class="msg-text">URGENCE — Besoin d'aide immédiate</span>
                </div>
              </div>

            </div>

            <!-- Footer -->
            <div class="card-footer">
              <div class="footer-meta">
                Générée par MAMAAI · {{ today | date:'dd/MM/yyyy' }}<br />
                Valable lors de chaque consultation
              </div>
              <div class="sos-badge">
                <span>🚨</span>
                <span>URGENCES : 15</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="actions">
            <button class="btn-print" (click)="printCard()">
              <mat-icon style="font-size:18px;width:18px;height:18px">print</mat-icon>
              Imprimer la carte
            </button>
            <button class="btn-share" (click)="shareCard()">
              <mat-icon style="font-size:18px;width:18px;height:18px">share</mat-icon>
              Partager
            </button>
          </div>

          <div class="tip-box">
            💡 <strong style="color:var(--text-dark)">Conseil :</strong>
            Imprimez cette carte et conservez-la dans votre sac. Montrez-la à chaque professionnel de santé pour faciliter la communication lors de votre grossesse.
          </div>
        }

      </div>
    </div>
  `
})
export class MedicalCardComponent implements OnInit {
  loading       = true;
  healthProfile: any = null;
  user: any     = null;
  bmi           = '';
  bmiLabel      = '';
  today         = new Date();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUser();
    this.http.get<any>(`${environment.apiUrl}/users/me`).subscribe({
      next: (res) => { if (res?.data) this.user = res.data; }
    });
    this.http.get<any>(`${environment.apiUrl}/users/me/health-profile`).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.data) { this.healthProfile = res.data; this.calcBmi(); }
      },
      error: () => { this.loading = false; }
    });
  }

  calcBmi(): void {
    const w = this.healthProfile?.weightKg, h = this.healthProfile?.heightCm;
    if (!w || !h) return;
    const bmi = w / ((h/100) * (h/100));
    this.bmi = bmi.toFixed(1);
    this.bmiLabel = bmi < 18.5 ? 'Insuffisance pondérale' : bmi < 25 ? 'Poids normal ✅' : bmi < 30 ? 'Surpoids' : 'Obésité';
  }

  printCard(): void { window.print(); }

  shareCard(): void {
    if (navigator.share) {
      navigator.share({ title: 'Ma Carte Médicale MAMAAI', text: 'Carte de communication médicale — ' + this.user?.firstName + ' ' + this.user?.lastName, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.snack.open('Lien copié !', 'OK', { duration: 2000 });
      });
    }
  }
}