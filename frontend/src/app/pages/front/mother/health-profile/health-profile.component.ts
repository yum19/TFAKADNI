import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { BloodType, HealthProfileResponse } from '../../../../core/models/health.models';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-health-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatInputModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDividerModule,
  ],
  template: `
    <section class="hp-page">
      <div class="hp-wrap">

        <!-- ── Header ── -->
        <header class="hp-header">
          <div class="header-copy">
            <span class="header-badge">🩺 Dossier Médical</span>
            <h1 class="hp-title">
              Votre santé,<br />
              <span class="title-accent">Centralisée.</span>
            </h1>
            <p class="hp-lead">
              Un profil médical complet pour des recommandations IA personnalisées,
              des alertes prénatales ciblées et un suivi de grossesse optimal.
            </p>
            <div class="quick-stats">
              <div class="qs-item">
                <div class="qs-val">{{ profile ? getBmi() : '—' }}</div>
                <div class="qs-key">IMC actuel</div>
              </div>
              <div class="qs-sep"></div>
              <div class="qs-item">
                <div class="qs-val">{{ profile?.bloodType ?? '—' }}</div>
                <div class="qs-key">Groupe sanguin</div>
              </div>
              <div class="qs-sep"></div>
              <div class="qs-item">
                <div class="qs-val">{{ profile ? profile.age + ' ans' : '—' }}</div>
                <div class="qs-key">Âge</div>
              </div>
            </div>
          </div>
          <div class="header-visual">
            <div class="visual-orb">
              <div class="orb-inner">
                <span class="orb-icon">🫀</span>
                <div class="orb-label">Profil Actif</div>
              </div>
            </div>
            <div class="v-badge v-badge--top">❤️ Suivi prénatal</div>
            <div class="v-badge v-badge--bot">🧬 IA Santé liée</div>
          </div>
        </header>

        <!-- ── Section Meta ── -->
        <div class="section-meta">
          <span class="section-chip">{{ profile && !editMode ? 'Mon Profil' : (profile ? 'Modification' : 'Création') }}</span>
          <div class="section-line"></div>
          <span class="result-count">{{ profile ? 'Profil enregistré ✓' : 'Aucun profil' }}</span>
        </div>

        <!-- Loading -->
        <div *ngIf="loading" class="hp-loading">
          <div class="loading-ring"></div>
          <p>Chargement de votre profil...</p>
        </div>

        <div *ngIf="!loading" class="hp-content">

          <!-- ── Summary View ── -->
          <div *ngIf="profile && !editMode" class="summary-grid">

            <!-- Left: main content -->
            <div class="summary-main">

              <!-- Profile Hero Card -->
              <div class="profile-hero-card">
                <div class="phc-avatar">👩‍⚕️</div>
                <div class="phc-info">
                  <h2 class="phc-name">{{ profile.firstName }} {{ profile.lastName }}</h2>
                  <p class="phc-updated">Mis à jour le {{ profile.updatedAt | date:'dd MMMM yyyy' }}</p>
                  <div class="phc-tags">
                    <span class="phc-tag">{{ profile.bloodType ?? 'Groupe N/A' }}</span>
                    <span class="phc-tag phc-tag--active">✓ Profil Actif</span>
                  </div>
                </div>
                <button class="btn-edit-float" (click)="editMode = true">✏️ Modifier</button>
              </div>

              <!-- Metrics Grid -->
              <div class="metrics-row">
                <div class="metric-card metric-card--rose">
                  <div class="metric-icon">⚖️</div>
                  <div class="metric-val">{{ profile.weightKg }} kg</div>
                  <div class="metric-lbl">Poids</div>
                </div>
                <div class="metric-card metric-card--sage">
                  <div class="metric-icon">📏</div>
                  <div class="metric-val">{{ profile.heightCm }} cm</div>
                  <div class="metric-lbl">Taille</div>
                </div>
                <div class="metric-card metric-card--gold">
                  <div class="metric-icon">🔢</div>
                  <div class="metric-val">{{ getBmi() }}</div>
                  <div class="metric-lbl">IMC</div>
                </div>
                <div class="metric-card metric-card--plum">
                  <div class="metric-icon">🎂</div>
                  <div class="metric-val">{{ profile.age }}</div>
                  <div class="metric-lbl">Âge</div>
                </div>
              </div>

              <!-- Prenatal milestones strip -->
              <div class="milestone-strip">
                <div class="milestone-item milestone-item--done">
                  <div class="milestone-dot">✓</div>
                  <div class="milestone-text">Profil créé</div>
                </div>
                <div class="milestone-connector"></div>
                <div class="milestone-item milestone-item--done">
                  <div class="milestone-dot">✓</div>
                  <div class="milestone-text">Données vitales</div>
                </div>
                <div class="milestone-connector"></div>
                <div class="milestone-item" [class.milestone-item--done]="getAllergies() || getConditions()">
                  <div class="milestone-dot">{{ (getAllergies() || getConditions()) ? '✓' : '○' }}</div>
                  <div class="milestone-text">Antécédents</div>
                </div>
                <div class="milestone-connector"></div>
                <div class="milestone-item">
                  <div class="milestone-dot">○</div>
                  <div class="milestone-text">IA activée</div>
                </div>
              </div>
            </div>

            <!-- Right: sidebar -->
            <div class="summary-sidebar">
              <div class="info-card">
                <div class="info-card-header">
                  <span class="info-card-icon">⚠️</span>
                  <span class="info-card-title">Allergies</span>
                </div>
                <p class="info-card-body">{{ getAllergies() || 'Aucune allergie renseignée' }}</p>
              </div>
              <div class="info-card">
                <div class="info-card-header">
                  <span class="info-card-icon">🏥</span>
                  <span class="info-card-title">Maladies chroniques</span>
                </div>
                <p class="info-card-body">{{ getConditions() || 'Aucune maladie chronique' }}</p>
              </div>
              <div class="info-card">
                <div class="info-card-header">
                  <span class="info-card-icon">📝</span>
                  <span class="info-card-title">Notes médicales</span>
                </div>
                <p class="info-card-body">{{ getNotes() || 'Aucune note supplémentaire' }}</p>
              </div>

              <!-- Wellbeing tips -->
              <div class="wellbeing-tips">
                <div class="tips-header">💡 Conseils du moment</div>
                <div class="tip-item"><span class="tip-dot"></span>Buvez 2L d'eau par jour pour rester hydratée</div>
                <div class="tip-item"><span class="tip-dot"></span>Prenez votre acide folique quotidiennement</div>
                <div class="tip-item"><span class="tip-dot"></span>Marchez 30 min par jour si possible</div>
                <div class="tip-item"><span class="tip-dot"></span>Dormez sur le côté gauche pour la circulation</div>
              </div>
            </div>
          </div>

          <!-- ── Form View ── -->
          <div *ngIf="!profile || editMode" class="form-wrap">
            <div class="form-card">
              <div class="form-card-header">
                <div class="form-header-icon">{{ profile ? '✏️' : '➕' }}</div>
                <div>
                  <h3 class="form-card-title">{{ profile ? 'Modifier le profil santé' : 'Créer votre profil santé' }}</h3>
                  <p class="form-card-sub">🔒 Vos données sont chiffrées et sécurisées</p>
                </div>
              </div>

              <form [formGroup]="healthForm" (ngSubmit)="onSubmit()">
                <div class="form-section-label">📊 Données vitales</div>
                <div class="form-grid-4">
                  <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Âge</mat-label>
                    <input matInput type="number" formControlName="age" placeholder="28" />
                    <mat-error>Entre 10 et 100 ans</mat-error>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Poids (kg)</mat-label>
                    <input matInput type="number" formControlName="weightKg" placeholder="65" step="0.1" />
                    <mat-error>Entre 20 et 300 kg</mat-error>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Taille (cm)</mat-label>
                    <input matInput type="number" formControlName="heightCm" placeholder="165" />
                    <mat-error>Entre 50 et 250 cm</mat-error>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Groupe sanguin</mat-label>
                    <mat-select formControlName="bloodType">
                      <mat-option value="">Non renseigné</mat-option>
                      <mat-option *ngFor="let bt of bloodTypes" [value]="bt">{{ bt }}</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="form-section-label">🏥 Antécédents médicaux</div>
                <div class="form-grid-2">
                  <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Allergies</mat-label>
                    <input matInput formControlName="allergies" placeholder="Ex: Pénicilline, arachides..." />
                    <mat-hint>Laissez vide si aucune allergie</mat-hint>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Maladies chroniques</mat-label>
                    <input matInput formControlName="conditions" placeholder="Ex: Diabète, hypertension..." />
                    <mat-hint>Laissez vide si aucune maladie</mat-hint>
                  </mat-form-field>
                </div>
                <mat-form-field appearance="outline" class="w-100" style="margin-bottom:8px">
                  <mat-label>Notes médicales supplémentaires</mat-label>
                  <textarea matInput formControlName="notes" rows="3"
                    placeholder="Informations médicales complémentaires, traitements en cours..."></textarea>
                </mat-form-field>

                <div class="form-actions">
                  <button class="btn-aurora" type="submit" [disabled]="healthForm.invalid || saving">
                    <div class="btn-spinner" *ngIf="saving"></div>
                    <span>{{ saving ? 'Enregistrement...' : (profile ? 'Mettre à jour' : 'Créer le profil') }}</span>
                    <svg *ngIf="!saving" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                  <button class="btn-ghost" type="button" *ngIf="editMode" (click)="editMode = false">Annuler</button>
                </div>
              </form>
            </div>

            <div class="privacy-note">
              🔒 Vos données de santé sont chiffrées et ne sont jamais partagées sans votre consentement. Conformité RGPD garantie.
            </div>
          </div>

        </div>
      </div>
    </section>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

    :host {
      --rose:        #c94d6a;
      --rose-light:  #f5c6d0;
      --rose-pale:   #fdf0f3;
      --rose-bg:     rgba(201,77,106,0.10);
      --rose-border: rgba(201,77,106,0.25);
      --sage:        #5a9e7a;
      --gold:        #c9943a;
      --plum:        #8b5cf6;
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
    .hp-page {
      min-height: 100vh;
      position: relative;
      font-family: var(--font-body);
    }
    .hp-page::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: url('/assets/img/mother_pages_background-3.png');
      background-size: cover;
      background-position: center;
      z-index: -1;
    }
    .hp-page::after {
      content: '';
      position: fixed;
      inset: 0;
      background: rgba(247, 237, 228, 0.85);
      z-index: -1;
    }

    .hp-wrap {
      position: relative;
      z-index: 1;
      max-width: 1400px;
      margin: 0 auto;
      padding: 3rem 2.5rem 4rem;
    }
    @media(max-width:600px){ .hp-wrap { padding: 2rem 1.5rem 3rem; } }

    /* ── Header ── */
    .hp-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 3rem;
      margin-bottom: 2.5rem;
    }
    @media(max-width:900px){ .hp-header { flex-direction: column; align-items: flex-start; } }

    .header-copy { flex: 1; }

    .header-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--rose);
      background: var(--rose-bg);
      border: 1.5px solid var(--rose-border);
      padding: 4px 14px;
      border-radius: 20px;
      margin-bottom: 1rem;
    }

    .hp-title {
      font-family: var(--font-display);
      font-size: clamp(2.4rem, 4.5vw, 3.8rem);
      font-weight: 700;
      line-height: 1.08;
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
    .hp-lead {
      font-size: 0.95rem;
      color: var(--text-mid);
      max-width: 460px;
      line-height: 1.7;
      margin-bottom: 1.5rem;
    }

    /* Quick stats */
    .quick-stats {
      display: flex;
      align-items: center;
      gap: 18px;
      background: rgba(255,255,255,0.75);
      border: 1.5px solid rgba(201,77,106,0.18);
      border-radius: var(--radius-lg);
      padding: 14px 22px;
      backdrop-filter: blur(12px);
      width: fit-content;
      box-shadow: var(--shadow-card);
    }
    .qs-item { text-align: center; }
    .qs-val {
      font-family: var(--font-display);
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--rose);
      line-height: 1;
    }
    .qs-key { font-size: 0.62rem; color: var(--text-soft); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; font-weight: 600; }
    .qs-sep { width: 1px; height: 28px; background: var(--rose-border); }

    /* Header Visual */
    .header-visual {
      position: relative;
      width: 200px;
      height: 200px;
      flex-shrink: 0;
    }
    @media(max-width:900px){ .header-visual { display: none; } }
    .visual-orb {
      width: 160px; height: 160px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(201,77,106,0.12), rgba(245,198,208,0.20));
      border: 1.5px solid var(--rose-border);
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(12px);
      animation: orbFloat 6s ease-in-out infinite;
      box-shadow: var(--shadow-card);
    }
    @keyframes orbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    .orb-inner { text-align: center; }
    .orb-icon { font-size: 3rem; display: block; }
    .orb-label { font-size: 0.6rem; color: var(--rose); text-transform: uppercase; letter-spacing: 0.12em; margin-top: 6px; font-weight: 700; }
    .v-badge {
      position: absolute;
      background: rgba(255,255,255,0.92);
      border: 1.5px solid var(--rose-border);
      border-radius: 30px;
      padding: 5px 12px;
      font-size: 0.70rem;
      font-weight: 600;
      color: var(--text-dark);
      white-space: nowrap;
      box-shadow: var(--shadow-card);
    }
    .v-badge--top { top: -8px; right: -20px; }
    .v-badge--bot { bottom: 8px; right: -30px; }

    /* ── Section Meta ── */
    .section-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem; }
    .section-chip {
      font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--rose); background: var(--rose-bg); border: 1.5px solid var(--rose-border);
      padding: 3px 14px; border-radius: 20px; white-space: nowrap;
    }
    .section-line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--rose-border), transparent); }
    .result-count { font-size: 0.78rem; color: var(--text-soft); font-weight: 600; white-space: nowrap; }

    /* Loading */
    .hp-loading { text-align: center; padding: 80px 20px; }
    .loading-ring {
      width: 48px; height: 48px;
      border: 3px solid var(--rose-border);
      border-top-color: var(--rose);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .hp-loading p { color: var(--text-soft); font-size: 0.88rem; }

    /* ── Summary Grid ── */
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 1.5rem;
      align-items: start;
    }
    @media(max-width:1100px){ .summary-grid { grid-template-columns: 1fr; } }

    /* Profile Hero Card */
    .profile-hero-card {
      display: flex;
      align-items: center;
      gap: 18px;
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-xl);
      padding: 1.6rem;
      box-shadow: var(--shadow-card);
      margin-bottom: 1.2rem;
      position: relative;
    }
    .phc-avatar {
      width: 68px; height: 68px;
      border-radius: 50%;
      background: var(--rose-bg);
      border: 2px solid var(--rose-border);
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; flex-shrink: 0;
    }
    .phc-name {
      font-family: var(--font-display);
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 3px;
    }
    .phc-updated { font-size: 0.72rem; color: var(--text-soft); margin-bottom: 8px; }
    .phc-tags { display: flex; gap: 7px; }
    .phc-tag {
      font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
      padding: 3px 10px; border-radius: 20px;
      background: rgba(26,18,21,0.06); color: var(--text-soft); border: 1px solid rgba(26,18,21,0.10);
    }
    .phc-tag--active { background: var(--rose-bg); color: var(--rose); border-color: var(--rose-border); }
    .btn-edit-float {
      position: absolute; top: 18px; right: 18px;
      background: rgba(255,255,255,0.90);
      border: 1.5px solid var(--rose-border);
      color: var(--rose);
      border-radius: 30px; padding: 6px 14px;
      font-size: 0.72rem; font-weight: 600; cursor: pointer;
      font-family: var(--font-body); transition: all 0.2s;
    }
    .btn-edit-float:hover { background: var(--rose-bg); }

    /* Metrics */
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.2rem;
    }
    @media(max-width:640px){ .metrics-row { grid-template-columns: repeat(2, 1fr); } }
    .metric-card {
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-lg);
      padding: 1.2rem;
      text-align: center;
      box-shadow: var(--shadow-card);
      transition: transform 0.22s ease, box-shadow 0.22s ease;
    }
    .metric-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(30,18,21,0.12); }
    .metric-card--rose { border-top: 3px solid var(--rose); }
    .metric-card--sage { border-top: 3px solid var(--sage); }
    .metric-card--gold { border-top: 3px solid var(--gold); }
    .metric-card--plum { border-top: 3px solid var(--plum); }
    .metric-icon { font-size: 1.6rem; margin-bottom: 7px; }
    .metric-val {
      font-family: var(--font-display);
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--text-dark);
    }
    .metric-lbl { font-size: 0.65rem; color: var(--text-soft); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; font-weight: 600; }

    /* Milestone Strip */
    .milestone-strip {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-lg);
      padding: 1.2rem 1.6rem;
      display: flex;
      align-items: center;
      gap: 0;
      box-shadow: var(--shadow-card);
    }
    .milestone-item { text-align: center; flex-shrink: 0; }
    .milestone-dot {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: rgba(201,77,106,0.12);
      border: 2px solid var(--rose-border);
      color: var(--text-soft);
      font-size: 0.7rem;
      font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 5px;
    }
    .milestone-item--done .milestone-dot {
      background: var(--rose-bg);
      border-color: var(--rose);
      color: var(--rose);
    }
    .milestone-text { font-size: 0.65rem; color: var(--text-soft); font-weight: 600; white-space: nowrap; }
    .milestone-connector { flex: 1; height: 2px; background: var(--rose-border); margin: 0 4px; margin-bottom: 18px; }

    /* Sidebar */
    .summary-sidebar { display: flex; flex-direction: column; gap: 1rem; }
    .info-card {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-lg);
      padding: 1.2rem 1.4rem;
      box-shadow: var(--shadow-card);
    }
    .info-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
    .info-card-icon { font-size: 1rem; }
    .info-card-title {
      font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-soft);
    }
    .info-card-body { font-size: 0.82rem; color: var(--text-mid); line-height: 1.6; margin: 0; }

    .wellbeing-tips {
      background: linear-gradient(135deg, rgba(201,77,106,0.08), rgba(201,148,58,0.06));
      border: 1.5px solid var(--rose-border);
      border-radius: var(--radius-lg);
      padding: 1.2rem 1.4rem;
      box-shadow: var(--shadow-card);
    }
    .tips-header {
      font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--rose); margin-bottom: 10px;
    }
    .tip-item { display: flex; align-items: flex-start; gap: 7px; font-size: 0.78rem; color: var(--text-mid); margin-bottom: 7px; line-height: 1.5; }
    .tip-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--rose); flex-shrink: 0; margin-top: 5px; }

    /* ── Form ── */
    .form-wrap { max-width: 900px; }
    .form-card {
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-xl);
      padding: 2.2rem 2.4rem;
      box-shadow: var(--shadow-card);
      margin-bottom: 1rem;
      animation: scaleIn 0.4s ease both;
    }
    @keyframes scaleIn { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
    .form-card-header { display: flex; align-items: center; gap: 14px; margin-bottom: 1.8rem; }
    .form-header-icon {
      width: 50px; height: 50px;
      background: var(--rose-bg);
      border: 1.5px solid var(--rose-border);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; flex-shrink: 0;
    }
    .form-card-title {
      font-family: var(--font-display);
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--text-dark);
      margin: 0 0 3px;
    }
    .form-card-sub { font-size: 0.78rem; color: var(--text-soft); margin: 0; }

    .form-section-label {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--rose);
      margin: 1.5rem 0 1rem;
    }
    .form-grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }
    @media(max-width:900px){ .form-grid-4 { grid-template-columns: repeat(2,1fr); } }
    @media(max-width:500px){ .form-grid-4 { grid-template-columns: 1fr; } }
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 14px;
    }
    @media(max-width:640px){ .form-grid-2 { grid-template-columns: 1fr; } }
    .w-100 { width: 100%; }

    /* Material overrides */
    ::ng-deep .hp-page .mat-mdc-form-field {
      --mdc-outlined-text-field-outline-color: rgba(201,77,106,0.22);
      --mdc-outlined-text-field-focus-outline-color: rgba(201,77,106,0.60);
      --mdc-outlined-text-field-label-text-color: var(--text-soft);
      --mdc-outlined-text-field-input-text-color: var(--text-dark);
    }

    .form-actions { display: flex; gap: 12px; align-items: center; margin-top: 1.5rem; }

    .btn-aurora {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 11px 26px;
      background: linear-gradient(135deg, rgba(201,77,106,0.15), rgba(168,114,46,0.10));
      color: var(--rose);
      border: 1.5px solid var(--rose-border);
      border-radius: 30px;
      font-family: var(--font-body);
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-aurora:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba(201,77,106,0.25), rgba(168,114,46,0.18));
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(201,77,106,0.25);
    }
    .btn-aurora:disabled { opacity: 0.5; cursor: default; }
    .btn-ghost {
      display: inline-flex; align-items: center;
      padding: 11px 22px;
      background: transparent;
      color: var(--text-soft);
      border: 1.5px solid rgba(26,18,21,0.15);
      border-radius: 30px;
      font-family: var(--font-body);
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-ghost:hover { background: rgba(0,0,0,0.04); color: var(--text-dark); }

    .btn-spinner {
      width: 13px; height: 13px;
      border: 2px solid var(--rose-border);
      border-top-color: var(--rose);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .privacy-note {
      font-size: 0.75rem;
      color: var(--text-soft);
      padding: 0 4px;
      line-height: 1.5;
    }
  `],
})
export class HealthProfileComponent implements OnInit {
  healthForm: FormGroup;
  profile: HealthProfileResponse | null = null;
  loading = true;
  saving = false;
  editMode = false;

  bloodTypes: BloodType[] = [
    'A_POS', 'A_NEG', 'B_POS', 'B_NEG',
    'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG',
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.healthForm = this.fb.group({
      age: [null, [Validators.required, Validators.min(10), Validators.max(100)]],
      weightKg: [null, [Validators.required, Validators.min(20), Validators.max(300)]],
      heightCm: [null, [Validators.required, Validators.min(50), Validators.max(250)]],
      bloodType: [null],
      allergies: [''],
      conditions: [''],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.userService.getMyHealthProfile().subscribe({
      next: (res) => {
        this.profile = res.data;
        this.loading = false;
        let allergies = '', conditions = '', notes = '';
        if (res.data.medicalHistoryJson) {
          try {
            const parsed = JSON.parse(res.data.medicalHistoryJson);
            allergies = parsed.allergies ?? '';
            conditions = parsed.conditions ?? '';
            notes = parsed.notes ?? '';
          } catch { notes = res.data.medicalHistoryJson; }
        }
        this.healthForm.patchValue({
          age: res.data.age, weightKg: res.data.weightKg,
          heightCm: res.data.heightCm, bloodType: res.data.bloodType ?? null,
          allergies, conditions, notes,
        });
      },
      error: (err) => {
        if (err.status === 404) this.profile = null;
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.healthForm.invalid) return;
    this.saving = true;
    const { age, weightKg, heightCm, bloodType, allergies, conditions, notes } = this.healthForm.value;
    const medicalHistoryJson = JSON.stringify({ allergies: allergies || '', conditions: conditions || '', notes: notes || '' });
    const payload = { age, weightKg, heightCm, bloodType, medicalHistoryJson };
    const action = this.profile ? this.userService.updateHealthProfile(payload) : this.userService.createHealthProfile(payload);
    action.subscribe({
      next: (res) => {
        this.profile = res.data; this.saving = false; this.editMode = false;
        this.snackBar.open(this.profile ? 'Profil mis à jour ✓' : 'Profil créé ✓', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err?.error?.message ?? 'Erreur lors de l\'enregistrement.', 'Fermer', { duration: 4000 });
      },
    });
  }

  getBmi(): string {
    if (!this.profile) return '-';
    const bmi = this.profile.weightKg / Math.pow(this.profile.heightCm / 100, 2);
    return bmi.toFixed(1);
  }

  getAllergies(): string {
    if (!this.profile?.medicalHistoryJson) return '';
    try { return JSON.parse(this.profile.medicalHistoryJson).allergies || ''; } catch { return ''; }
  }
  getConditions(): string {
    if (!this.profile?.medicalHistoryJson) return '';
    try { return JSON.parse(this.profile.medicalHistoryJson).conditions || ''; } catch { return ''; }
  }
  getNotes(): string {
    if (!this.profile?.medicalHistoryJson) return '';
    try { return JSON.parse(this.profile.medicalHistoryJson).notes || ''; } catch { return ''; }
  }
}