import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-ai-health',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatTabsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
  ],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

    :host {
      --plum:        #c94d6a;
      --plum-light:  #f5c6d0;
      --plum-pale:   #fdf0f3;
      --plum-bg:     rgba(201,77,106,0.10);
      --plum-border: rgba(201,77,106,0.25);
      --sky:         #5a9e7a;
      --sage:        #5a9e7a;
      --cream:       #f7ede4;
      --text-dark:   #1e1215;
      --text-mid:    #4a3038;
      --text-soft:   #7a5c65;
      --font-display: 'Playfair Display', Georgia, serif;
      --font-body:    'DM Sans', sans-serif;
      --radius-lg:   20px;
      --radius-xl:   28px;
      --shadow-card: 0 2px 16px rgba(30,18,21,0.10);
    }

    /* ── Page ── */
    .ai-page {
      min-height: 100vh;
      position: relative;
      font-family: var(--font-body);
    }
    .ai-page::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: url('/assets/img/mother_pages_background-3.png');
      background-size: cover;
      background-position: center;
      z-index: -1;
    }
    .ai-page::after {
      content: '';
      position: fixed;
      inset: 0;
      background: rgba(247, 237, 228, 0.84);
      z-index: -1;
    }

    .ai-wrap {
      position: relative;
      z-index: 1;
      max-width: 1400px;
      margin: 0 auto;
      padding: 3rem 2.5rem 4rem;
    }
    @media(max-width:600px){ .ai-wrap { padding: 2rem 1.5rem 3rem; } }

    /* ── Header ── */
    .ai-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2.5rem;
      margin-bottom: 2.5rem;
    }
    @media(max-width:900px){ .ai-header { flex-direction: column; align-items: flex-start; } }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-body);
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--plum);
      background: var(--plum-bg);
      border: 1.5px solid var(--plum-border);
      padding: 4px 14px;
      border-radius: 20px;
      margin-bottom: 1rem;
    }
    .badge-pulse {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--plum);
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }

    .ai-title {
      font-family: var(--font-display);
      font-size: clamp(2.2rem, 4.5vw, 3.5rem);
      font-weight: 700;
      line-height: 1.1;
      color: var(--text-dark);
      margin-bottom: 0.8rem;
    }
    .title-accent {
      font-style: italic;
      background: linear-gradient(135deg, #c94d6a, #e8758a, #c94d6a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .ai-lead {
      font-size: 0.95rem;
      color: var(--text-mid);
      max-width: 460px;
      line-height: 1.7;
      margin-bottom: 1.5rem;
    }
    .powered-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .powered-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.70);
      border: 1.5px solid var(--plum-border);
      border-radius: 30px;
      padding: 6px 14px;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-mid);
    }

    /* Hero stat */
    .hero-ai-wrap { flex-shrink: 0; }
    @media(max-width:900px){ .hero-ai-wrap { display: none; } }
    .hero-ai-card {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1.5px solid var(--plum-border);
      border-radius: var(--radius-xl);
      padding: 24px 28px;
      text-align: center;
      box-shadow: var(--shadow-card);
    }
    .hero-ai-icon { font-size: 2.4rem; margin-bottom: 8px; }
    .hero-ai-num {
      font-family: var(--font-display);
      font-size: 2.4rem;
      font-weight: 700;
      color: var(--plum);
      line-height: 1;
    }
    .hero-ai-lbl {
      font-size: 0.68rem;
      color: var(--text-soft);
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-top: 4px;
    }

    /* ── Feature Strip ── */
    .feature-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    @media(max-width:900px){ .feature-strip { grid-template-columns: repeat(2, 1fr); } }
    @media(max-width:500px){ .feature-strip { grid-template-columns: 1fr; } }
    .feature-card {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-lg);
      padding: 1.2rem;
      text-align: center;
      box-shadow: var(--shadow-card);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .feature-card:hover { transform: translateY(-3px); box-shadow: 0 6px 24px rgba(30,18,21,0.12); }
    .feature-card-icon { font-size: 1.6rem; margin-bottom: 7px; }
    .feature-card-title {
      font-family: var(--font-display);
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 4px;
    }
    .feature-card-sub { font-size: 0.70rem; color: var(--text-soft); line-height: 1.4; }

    /* ── Section Meta ── */
    .section-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 1.2rem;
    }
    .section-chip {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--plum);
      background: var(--plum-bg);
      border: 1.5px solid var(--plum-border);
      padding: 3px 14px;
      border-radius: 20px;
      white-space: nowrap;
    }
    .section-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, var(--plum-border), transparent);
    }

    /* ── Tabs Container ── */
    .tabs-container {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }
    .tab-nav {
      display: flex;
      background: rgba(201,77,106,0.06);
      border-bottom: 1.5px solid rgba(201,77,106,0.12);
      overflow-x: auto;
    }
    .tab-btn {
      flex: 1;
      min-width: 120px;
      padding: 15px 18px;
      background: transparent;
      border: none;
      color: var(--text-soft);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      font-family: var(--font-body);
      border-bottom: 2.5px solid transparent;
    }
    .tab-btn:hover { color: var(--plum); background: rgba(124,78,168,0.04); }
    .tab-btn.active {
      color: var(--plum);
      border-bottom-color: var(--plum);
      background: rgba(124,78,168,0.07);
    }

    .tab-content { padding: 2rem; }
    @media(max-width:600px){ .tab-content { padding: 1.2rem; } }

    /* ── AI Card ── */
    .ai-card {
      background: rgba(243,232,255,0.30);
      border: 1.5px solid var(--plum-border);
      border-radius: var(--radius-lg);
      padding: 1.6rem;
      margin-bottom: 1.2rem;
    }
    .card-title {
      font-family: var(--font-display);
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-dark);
      margin: 0 0 1.2rem;
      display: flex; align-items: center; gap: 8px;
    }
    .grid2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    @media(max-width:640px){ .grid2 { grid-template-columns: 1fr; } }

    /* Material overrides */
    ::ng-deep .ai-page .mat-mdc-form-field {
      --mdc-outlined-text-field-outline-color: rgba(201,77,106,0.25);
      --mdc-outlined-text-field-focus-outline-color: rgba(201,77,106,0.65);
      --mdc-outlined-text-field-label-text-color: var(--text-soft);
      --mdc-outlined-text-field-input-text-color: var(--text-dark);
    }

    /* ── Import Button ── */
    .btn-import {
      width: 100%;
      padding: 11px 18px;
      background: rgba(255,255,255,0.75);
      border: 1.5px solid var(--plum-border);
      color: var(--plum);
      border-radius: 12px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-bottom: 1.2rem;
      font-family: var(--font-body);
      transition: all 0.2s;
    }
    .btn-import:hover { background: var(--plum-bg); }
    .btn-import:disabled { opacity: 0.5; cursor: default; }

    /* ── Primary AI Button ── */
    .btn-ai {
      width: 100%;
      padding: 12px 20px;
      background: linear-gradient(135deg, rgba(201,77,106,0.18), rgba(232,117,138,0.12));
      color: var(--plum);
      border: 1.5px solid var(--plum-border);
      border-radius: 30px;
      font-family: var(--font-body);
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.22s ease;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-top: 8px;
    }
    .btn-ai:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba(201,77,106,0.28), rgba(232,117,138,0.20));
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(201,77,106,0.25);
    }
    .btn-ai:disabled { opacity: 0.5; cursor: default; }

    /* ── Result Panel ── */
    .result-panel {
      background: rgba(243,232,255,0.25);
      border: 1.5px solid var(--plum-border);
      border-radius: var(--radius-lg);
      padding: 1.6rem;
      animation: slideUp 0.4s ease;
    }
    @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    .rlabel {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-soft);
      margin-bottom: 5px;
    }
    .rval {
      font-size: 0.88rem;
      color: var(--text-mid);
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    .result-row {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1rem; flex-wrap: wrap; gap: 8px;
    }
    .badge {
      display: inline-flex; align-items: center;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
      font-family: var(--font-body);
    }
    .safe    { background: rgba(16,185,129,0.12); color: #059669; border: 1.5px solid rgba(16,185,129,0.3); }
    .caution { background: rgba(245,158,11,0.12); color: #d97706; border: 1.5px solid rgba(245,158,11,0.3); }
    .danger  { background: rgba(239,68,68,0.12);  color: #dc2626; border: 1.5px solid rgba(239,68,68,0.25); }

    .result-grid2 {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 12px;
    }
    @media(max-width:640px){ .result-grid2 { grid-template-columns: 1fr; } }

    .tip-item {
      display: flex; align-items: flex-start; gap: 8px;
      font-size: 0.82rem;
      color: var(--text-mid);
      margin-bottom: 8px;
      line-height: 1.5;
    }
    .tip-dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: var(--plum);
      flex-shrink: 0;
      margin-top: 5px;
    }
    .alertbox {
      background: rgba(239,68,68,0.08);
      border: 1.5px solid rgba(239,68,68,0.2);
      border-radius: 10px;
      padding: 9px 14px;
      font-size: 0.82rem;
      color: #dc2626;
      margin-bottom: 8px;
      display: flex; align-items: center; gap: 8px;
    }

    /* ── Mood Display ── */
    .mood-display {
      text-align: center;
      padding: 2rem 1.2rem;
    }
    .mood-emoji { font-size: 4.5rem; display: block; margin-bottom: 10px; }
    .mood-score {
      font-family: var(--font-display);
      font-size: 3.5rem;
      font-weight: 700;
      color: var(--plum);
      line-height: 1;
      margin-bottom: 6px;
    }
    .mood-label {
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--text-dark);
      margin-bottom: 1rem;
    }
    .affirmation {
      font-style: italic;
      color: var(--plum);
      font-size: 0.88rem;
      padding: 14px 18px;
      background: var(--plum-bg);
      border: 1.5px solid var(--plum-border);
      border-radius: 12px;
      line-height: 1.6;
      margin-top: 10px;
    }

    /* ── Mood quick buttons ── */
    .mood-quick { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 1rem; }
    .mood-btn {
      background: rgba(255,255,255,0.80);
      border: 1.5px solid var(--plum-border);
      color: var(--text-mid);
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-body);
      transition: all 0.15s;
    }
    .mood-btn:hover { background: var(--plum-bg); color: var(--plum); }

    /* ── Meds ── */
    .med-input-row { display: flex; gap: 10px; margin-bottom: 1rem; }
    .med-input-row mat-form-field { flex: 1; }
    .btn-add {
      padding: 0 18px;
      background: var(--plum-bg);
      border: 1.5px solid var(--plum-border);
      color: var(--plum);
      border-radius: 12px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-body);
      white-space: nowrap;
      transition: all 0.2s;
    }
    .btn-add:hover { background: rgba(201,77,106,0.18); }
    .meds-list { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 1rem; }
    .med-tag {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.85);
      border: 1.5px solid var(--plum-border);
      border-radius: 20px;
      padding: 5px 12px;
      font-size: 0.78rem;
      color: var(--text-mid);
      font-weight: 500;
    }
    .med-tag button {
      background: none; border: none; cursor: pointer;
      font-size: 1rem; line-height: 1; padding: 0;
      color: var(--text-soft);
      transition: color 0.2s;
    }
    .med-tag button:hover { color: #dc2626; }
    .med-result-item {
      background: rgba(255,255,255,0.75);
      border: 1.5px solid rgba(201,77,106,0.15);
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 8px;
    }
    .med-name { font-size: 0.88rem; font-weight: 700; color: var(--text-dark); margin-bottom: 5px; }
    .med-note { font-size: 0.78rem; color: var(--text-mid); line-height: 1.5; }

    /* ── Avatar ── */
    .avatar-display { text-align: center; padding: 1.5rem; }
    .avatar-img {
      width: 160px; height: 160px;
      border-radius: 50%;
      border: 3px solid var(--plum-border);
      object-fit: cover;
      margin-bottom: 1.2rem;
      box-shadow: 0 0 36px rgba(201,77,106,0.20);
    }
    .avatar-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
    .avatar-styles { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 1rem; }
    .style-btn {
      background: rgba(255,255,255,0.80);
      border: 1.5px solid var(--plum-border);
      color: var(--text-mid);
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-body);
      transition: all 0.15s;
    }
    .style-btn:hover { background: var(--plum-bg); color: var(--plum); }
    .btn-secondary {
      padding: 9px 18px;
      background: rgba(255,255,255,0.85);
      border: 1.5px solid var(--plum-border);
      color: var(--plum);
      border-radius: 30px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-body);
      transition: all 0.2s;
    }
    .btn-secondary:hover { background: var(--plum-bg); }
  `],
  template: `
    <div class="ai-page">
      <div class="ai-wrap">

        <!-- ── Header ── -->
        <header class="ai-header">
          <div class="header-copy">
            <span class="header-badge">
              <span class="badge-pulse"></span>
              Assistant IA Santé
            </span>
            <h1 class="ai-title">
              Intelligence au service<br />
              <span class="title-accent">de votre maternité.</span>
            </h1>
            <p class="ai-lead">
              Rapports santé personnalisés, analyse des humeurs, vérification de médicaments
              et avatar IA — propulsés par Gemini AI pour un suivi prénatal intelligent.
            </p>
            <div class="powered-row">
              <div class="powered-chip">🤖 Gemini AI</div>
              <div class="powered-chip">🔒 Données chiffrées</div>
              <div class="powered-chip">🎯 Personnalisé</div>
            </div>
          </div>
          <div class="hero-ai-wrap">
            <div class="hero-ai-card">
              <div class="hero-ai-icon">🧠</div>
              <div class="hero-ai-num">4</div>
              <div class="hero-ai-lbl">Outils IA</div>
            </div>
          </div>
        </header>

        <!-- ── Feature Cards ── -->
        <div class="feature-strip">
          <div class="feature-card">
            <div class="feature-card-icon">📊</div>
            <div class="feature-card-title">Rapport Santé</div>
            <div class="feature-card-sub">Analyse complète de vos indicateurs de grossesse</div>
          </div>
          <div class="feature-card">
            <div class="feature-card-icon">🧠</div>
            <div class="feature-card-title">Analyse Humeurs</div>
            <div class="feature-card-sub">Comprenez vos émotions et recevez des conseils</div>
          </div>
          <div class="feature-card">
            <div class="feature-card-icon">💊</div>
            <div class="feature-card-title">Check Médicaments</div>
            <div class="feature-card-sub">Vérifiez la sécurité de vos traitements</div>
          </div>
          <div class="feature-card">
            <div class="feature-card-icon">🎨</div>
            <div class="feature-card-title">Avatar IA</div>
            <div class="feature-card-sub">Créez votre portrait maternel personnalisé</div>
          </div>
        </div>

        <!-- ── Tabs ── -->
        <div class="section-meta">
          <span class="section-chip">Outils IA</span>
          <div class="section-line"></div>
        </div>

        <div class="tabs-container">
          <div class="tab-nav">
            <button class="tab-btn" [class.active]="activeTab===0" (click)="activeTab=0">📊 Rapport Santé</button>
            <button class="tab-btn" [class.active]="activeTab===1" (click)="activeTab=1">🧠 Humeur</button>
            <button class="tab-btn" [class.active]="activeTab===2" (click)="activeTab=2">💊 Médicaments</button>
            <button class="tab-btn" [class.active]="activeTab===3" (click)="activeTab=3">🎨 Avatar IA</button>
          </div>

          <div class="tab-content">

            <!-- ══ TAB 0: RAPPORT ══ -->
            <div *ngIf="activeTab===0">
              <div class="ai-card">
                <p class="card-title">📊 Générer mon rapport santé</p>
                <button class="btn-import" (click)="importHealthProfile()" [disabled]="rProfileLoading">
                  <mat-spinner *ngIf="rProfileLoading" diameter="14" style="--mdc-circular-progress-active-indicator-color:#7c4ea8"></mat-spinner>
                  <span *ngIf="!rProfileLoading">⬇️</span>
                  {{ rProfileLoading ? 'Importation...' : 'Importer depuis mon Profil Santé' }}
                </button>
                <div class="grid2">
                  <mat-form-field appearance="outline">
                    <mat-label>Âge</mat-label>
                    <input matInput type="number" [(ngModel)]="r.age" placeholder="28"/>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Poids (kg)</mat-label>
                    <input matInput type="number" [(ngModel)]="r.weight" placeholder="65"/>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Taille (cm)</mat-label>
                    <input matInput type="number" [(ngModel)]="r.height" placeholder="165"/>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Groupe sanguin</mat-label>
                    <input matInput [(ngModel)]="r.blood" placeholder="A+"/>
                  </mat-form-field>
                </div>
                <mat-form-field appearance="outline" style="width:100%;margin-bottom:8px">
                  <mat-label>Antécédents médicaux</mat-label>
                  <textarea matInput [(ngModel)]="r.history" rows="2"
                    placeholder="Diabète gestationnel, hypertension..."></textarea>
                </mat-form-field>
                <button class="btn-ai" (click)="genReport()" [disabled]="rLoading">
                  <mat-spinner *ngIf="rLoading" diameter="16" style="--mdc-circular-progress-active-indicator-color:#7c4ea8"></mat-spinner>
                  {{ rLoading ? 'Analyse IA en cours...' : '✨ Générer mon rapport IA' }}
                </button>
              </div>
              @if (rResult) {
                <div class="result-panel">
                  <div class="result-row">
                    <span class="rlabel">IMC calculé</span>
                    <span class="badge" [class]="bmiClass(rResult.bmiStatus)">
                      {{ rResult.bmi | number:'1.1-1' }} — {{ rResult.bmiStatus }}
                    </span>
                  </div>
                  <div class="rlabel">Résumé</div>
                  <div class="rval">{{ rResult.summary }}</div>
                  <div class="rlabel">Recommandations</div>
                  @for (rec of rResult.recommendations; track rec) {
                    <div class="tip-item"><div class="tip-dot"></div>{{ rec }}</div>
                  }
                  @for (a of rResult.alerts; track a) {
                    <div class="alertbox">⚠️ {{ a }}</div>
                  }
                  <div class="result-grid2">
                    <div>
                      <div class="rlabel">Nutrition</div>
                      <div class="rval" style="font-size:0.82rem">{{ rResult.nutrition }}</div>
                    </div>
                    <div>
                      <div class="rlabel">Activité physique</div>
                      <div class="rval" style="font-size:0.82rem">{{ rResult.activity }}</div>
                    </div>
                  </div>
                  <div class="rlabel">Prochaines étapes</div>
                  <div class="rval" style="font-size:0.82rem">{{ rResult.nextSteps }}</div>
                </div>
              }
            </div>

            <!-- ══ TAB 1: HUMEUR ══ -->
            <div *ngIf="activeTab===1">
              <div class="ai-card">
                <p class="card-title">🧠 Comment vous sentez-vous aujourd'hui ?</p>
                <div class="mood-quick">
                  <button *ngFor="let m of moodSuggestions" class="mood-btn" (click)="moodText = m.text">{{ m.label }}</button>
                </div>
                <mat-form-field appearance="outline" style="width:100%;margin-bottom:8px">
                  <mat-label>Décrivez votre état émotionnel...</mat-label>
                  <textarea matInput [(ngModel)]="moodText" rows="5"
                    placeholder="Je me sens fatiguée et un peu anxieuse depuis ce matin..."></textarea>
                </mat-form-field>
                <button class="btn-ai" (click)="analyzeMood()" [disabled]="mLoading || !moodText">
                  <mat-spinner *ngIf="mLoading" diameter="16" style="--mdc-circular-progress-active-indicator-color:#7c4ea8"></mat-spinner>
                  {{ mLoading ? 'Analyse en cours...' : '🧠 Analyser mon humeur' }}
                </button>
              </div>
              @if (mResult) {
                <div class="result-panel">
                  <div class="mood-display">
                    <span class="mood-emoji">{{ mResult.emoji || '💜' }}</span>
                    <div class="mood-score">{{ mResult.moodScore }}/10</div>
                    <div class="mood-label">{{ mResult.mood }}</div>
                    <div class="affirmation">{{ mResult.affirmation }}</div>
                  </div>
                  @for (tip of mResult.tips; track tip) {
                    <div class="tip-item"><div class="tip-dot"></div>{{ tip }}</div>
                  }
                </div>
              }
            </div>

            <!-- ══ TAB 2: MÉDICAMENTS ══ -->
            <div *ngIf="activeTab===2">
              <div class="ai-card">
                <p class="card-title">💊 Vérification des médicaments</p>
                <div class="med-input-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Nom du médicament</mat-label>
                    <input matInput [(ngModel)]="newMed" placeholder="Ex: Paracétamol" (keyup.enter)="addMed()"/>
                  </mat-form-field>
                  <button class="btn-add" (click)="addMed()">+ Ajouter</button>
                </div>
                <div class="meds-list" *ngIf="meds.length > 0">
                  <div class="med-tag" *ngFor="let m of meds">
                    💊 {{ m }}<button (click)="removeMed(m)">×</button>
                  </div>
                </div>
                <mat-form-field appearance="outline" style="width:100%;margin-bottom:12px">
                  <mat-label>Semaine de grossesse</mat-label>
                  <input matInput type="number" [(ngModel)]="medWeek" placeholder="Ex: 24" min="1" max="42"/>
                </mat-form-field>
                <button class="btn-ai" (click)="checkMeds()" [disabled]="medLoading || meds.length === 0">
                  <mat-spinner *ngIf="medLoading" diameter="16" style="--mdc-circular-progress-active-indicator-color:#7c4ea8"></mat-spinner>
                  {{ medLoading ? 'Vérification en cours...' : '🔍 Analyser la sécurité' }}
                </button>
              </div>
              @if (medResult) {
                <div class="result-panel">
                  <div class="rlabel" style="margin-bottom:12px">Résultats de l'analyse</div>
                  @for (item of medResult.medications; track item.name) {
                    <div class="med-result-item">
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
                        <div class="med-name">💊 {{ item.name }}</div>
                        <span class="badge" [class]="safetyClass(item.safety)">{{ item.safety }}</span>
                      </div>
                      <div class="med-note">{{ item.notes }}</div>
                    </div>
                  }
                  <div class="rlabel" style="margin-top:14px">Résumé général</div>
                  <div class="rval" style="font-size:0.82rem">{{ medResult.summary }}</div>
                </div>
              }
            </div>

            <!-- ══ TAB 3: AVATAR IA ══ -->
            <div *ngIf="activeTab===3">
              <div class="ai-card">
                <p class="card-title">🎨 Créer mon avatar IA</p>
                <div class="avatar-styles">
                  <button *ngFor="let s of avatarStyles" class="style-btn" (click)="avatarDesc = s.desc">{{ s.label }}</button>
                </div>
                <mat-form-field appearance="outline" style="width:100%;margin-bottom:8px">
                  <mat-label>Décrivez votre avatar</mat-label>
                  <textarea matInput [(ngModel)]="avatarDesc" rows="3"
                    placeholder="Femme enceinte, cheveux bouclés bruns, sourire doux, style élégant..."></textarea>
                </mat-form-field>
                <button class="btn-ai" (click)="genAvatar()" [disabled]="aLoading || !avatarDesc">
                  <mat-spinner *ngIf="aLoading" diameter="16" style="--mdc-circular-progress-active-indicator-color:#7c4ea8"></mat-spinner>
                  {{ aLoading ? 'Génération en cours...' : '✨ Générer mon avatar' }}
                </button>
              </div>
              @if (aResult) {
                <div class="result-panel">
                  <div class="avatar-display">
                    <img class="avatar-img" [src]="aResult.avatarUrl || 'assets/img/user-4.jpg'" alt="Avatar IA"
                      (load)="onImgLoad()" (error)="onImgErr($event)" />
                    <div class="avatar-actions">
                      <button class="btn-secondary" (click)="downloadAvatar()">⬇️ Télécharger</button>
                      <button class="btn-ai" style="width:auto;padding:10px 20px;" (click)="useAsAvatar()" [disabled]="avatarSaving">
                        {{ avatarSaving ? 'Sauvegarde...' : '✅ Utiliser comme photo' }}
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>

          </div>
        </div>

      </div>
    </div>
  `
})
export class AiHealthComponent {
  activeTab = 0;
  r = { age: null as any, weight: null as any, height: null as any, blood: '', history: '' };
  rProfileLoading = false; rLoading = false; rResult: any = null;
  moodText = ''; mLoading = false; mResult: any = null;
  moodSuggestions = [
    { label: '😴 Fatiguée', text: 'Je me sens très fatiguée aujourd\'hui, sans énergie.' },
    { label: '😰 Anxieuse', text: 'Je ressens de l\'anxiété et des inquiétudes concernant ma grossesse.' },
    { label: '😊 Heureuse', text: 'Je me sens bien et pleine d\'énergie positive aujourd\'hui.' },
    { label: '😢 Triste', text: 'Je me sens un peu triste et émotionnellement fragilisée.' },
  ];
  newMed = ''; meds: string[] = []; medWeek: number | null = null; medLoading = false; medResult: any = null;
  avatarDesc = ''; aLoading = false; aResult: any = null; imgLoaded = false; avatarSaving = false;
  avatarSeed = Math.floor(Math.random() * 999999);
  avatarStyles = [
    { label: '🌸 Naturelle', desc: 'Femme enceinte, style naturel et doux, lumière dorée, sourire serein' },
    { label: '✨ Élégante', desc: 'Femme enceinte, style élégant et moderne, portrait raffiné' },
    { label: '🎨 Artistique', desc: 'Portrait artistique d\'une femme enceinte, style aquarelle délicat' },
  ];

  constructor(private http: HttpClient, private snack: MatSnackBar, private authService: AuthService) {}

  importHealthProfile(): void {
    this.rProfileLoading = true;
    this.http.get<any>(`${environment.apiUrl}/users/me/health-profile`).subscribe({
      next: (res) => {
        this.rProfileLoading = false;
        const d = res?.data;
        if (d) {
          if (d.age) this.r.age = d.age;
          if (d.weightKg) this.r.weight = d.weightKg;
          if (d.heightCm) this.r.height = d.heightCm;
          if (d.bloodType) this.r.blood = d.bloodType;
          if (d.medicalHistoryJson) {
            try { const h = JSON.parse(d.medicalHistoryJson); this.r.history = Object.values(h).filter(Boolean).join(', '); }
            catch { this.r.history = d.medicalHistoryJson; }
          }
          this.snack.open('✅ Données importées depuis votre Profil Santé', 'OK', { duration: 3000 });
        } else { this.snack.open('Profil santé non renseigné.', 'OK', { duration: 4000 }); }
      },
      error: () => { this.rProfileLoading = false; this.snack.open('Impossible de charger le profil santé.', 'OK', { duration: 3000 }); }
    });
  }

  genReport(): void {
    this.rLoading = true;
    this.http.post<any>(`${environment.apiUrl}/ai/health-report`, {
      age: this.r.age, weight: this.r.weight, height: this.r.height, bloodType: this.r.blood, medicalHistory: this.r.history
    }).subscribe({ next: (res) => { this.rLoading = false; this.rResult = res.data; }, error: () => { this.rLoading = false; this.snack.open('Erreur IA', 'OK', { duration: 3000 }); } });
  }

  analyzeMood(): void {
    this.mLoading = true;
    this.http.post<any>(`${environment.apiUrl}/ai/mood-analysis`, { text: this.moodText }).subscribe({
      next: (res) => { 
        this.mLoading = false;
        this.mResult = res.data;
        console.log(this.mResult);
      },
      error: () => { this.mLoading = false; this.snack.open('Erreur IA', 'OK', { duration: 3000 }); }
    });
  }

  addMed(): void { if (this.newMed.trim()) { this.meds.push(this.newMed.trim()); this.newMed = ''; } }
  removeMed(m: string): void { this.meds = this.meds.filter(x => x !== m); }

  checkMeds(): void {
    this.medLoading = true;
    this.http.post<any>(`${environment.apiUrl}/ai/medication-check`, { medications: this.meds, weekOfPregnancy: this.medWeek }).subscribe({
      next: (res) => { this.medLoading = false; this.medResult = res.data; },
      error: () => { this.medLoading = false; this.snack.open('Erreur IA', 'OK', { duration: 3000 }); }
    });
  }

  genAvatar(): void {
    this.aLoading = true; this.imgLoaded = false; this.aResult = null;
    this.avatarSeed = Math.floor(Math.random() * 999999);
    this.http.post<any>(`${environment.apiUrl}/ai/avatar-prompt`, { description: this.avatarDesc, seed: this.avatarSeed }).subscribe({
      next: (res) => { this.aLoading = false; this.aResult = res.data; },
      error: () => { this.aLoading = false; this.snack.open('Erreur IA', 'OK', { duration: 3000 }); }
    });
  }

  onImgLoad(): void { this.imgLoaded = true; }

  downloadAvatar(): void {
    if (!this.aResult?.avatarUrl) return;
    const a = document.createElement('a'); a.href = this.aResult.avatarUrl; a.download = 'avatar-mamaai.jpg'; a.click();
  }

  useAsAvatar(): void {
    if (!this.aResult?.avatarUrl || this.avatarSaving) return;
    this.avatarSaving = true;
    fetch(this.aResult.avatarUrl).then(r => r.blob()).then(blob => {
      const fd = new FormData(); fd.append('file', blob, 'avatar-ai.jpg');
      return this.http.post<any>(`${environment.apiUrl}/users/me/avatar`, fd).toPromise();
    }).then(() => {
      this.avatarSaving = false;
      this.http.get<any>(`${environment.apiUrl}/users/me`).subscribe({ next: (r) => { if (r?.data) this.authService.updateCurrentUser(r.data); } });
      this.snack.open('✅ Photo de profil mise à jour !', 'OK', { duration: 3000 });
    }).catch(() => { this.avatarSaving = false; this.snack.open('Erreur lors de la sauvegarde.', 'OK', { duration: 3000 }); });
  }

  onImgErr(e: any): void { e.target.src = 'assets/img/user-4.jpg'; this.imgLoaded = true; }

  bmiClass(s: string): string {
    if (!s) return 'badge';
    const l = s.toLowerCase();
    if (l.includes('normal')) return 'badge safe';
    if (l.includes('surpoids') || l.includes('sous')) return 'badge caution';
    return 'badge danger';
  }
  safetyClass(s: string): string {
    if (s === 'SAFE') return 'badge safe';
    if (s === 'CAUTION') return 'badge caution';
    if (s === 'DANGER') return 'badge danger';
    return 'badge';
  }
}