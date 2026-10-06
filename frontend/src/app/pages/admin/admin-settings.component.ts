import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, MatSlideToggleModule, MatIconModule,
    MatProgressSpinnerModule, MatDividerModule, MatTooltipModule],
  styles: [`

    :host {
      --rose: #e8436c;
      --rose-light: #fdf0f3;
      --ink: #1a1028;
      --ink-soft: #3d2f4a;
      --muted: #8b7d98;
      --border: #ede8f2;
      --surface: #faf8fc;
      --white: #fff;
      --green: #16a34a;
      --green-light: #f0fdf4;
      --shadow-sm: 0 2px 8px rgba(26,16,40,.06);
      --shadow-md: 0 8px 32px rgba(26,16,40,.10);
      display: block;
      
      min-height: 100vh;
    }

    .settings-page { max-width: 1280px; margin: 0 auto; padding: 2.5rem 2rem; }

    /* ── Header ── */
    .page-eyebrow {
       font-size: 11px; font-weight: 700;
      letter-spacing: .18em; text-transform: uppercase; color: var(--rose); margin-bottom: .4rem;
    }
    .page-title {  font-size: 2.2rem; font-weight: 800; color: var(--ink); margin: 0 0 .35rem; }
    .page-sub { font-size: 14px; color: var(--muted); margin: 0 0 2.5rem; font-weight: 300; }

    /* ── Security Score Card ── */
    .score-card {
      background: linear-gradient(135deg, var(--ink) 0%, #3d2f4a 100%);
      border-radius: 24px; padding: 2rem 2.5rem; margin-bottom: 2rem;
      display: grid; grid-template-columns: 1fr auto; gap: 2rem; align-items: center;
      position: relative; overflow: hidden;
    }
    .score-card::before {
      content: ''; position: absolute;
      top: -50px; right: 80px; width: 160px; height: 160px;
      border-radius: 50%; background: rgba(232,67,108,.18);
    }
    .score-card::after {
      content: ''; position: absolute;
      bottom: -40px; right: -30px; width: 120px; height: 120px;
      border-radius: 50%; background: rgba(232,67,108,.1);
    }
    .score-label { font-size: 12px; color: rgba(255,255,255,.55); text-transform: uppercase; letter-spacing: .1em; margin-bottom: .5rem; }
    .score-title {  font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: .25rem; }
    .score-desc { font-size: 13px; color: rgba(255,255,255,.55); font-weight: 300; max-width: 420px; }
    .score-ring {
      position: relative; width: 80px; height: 80px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; z-index: 1;
    }
    .score-ring svg { position: absolute; top: 0; left: 0; transform: rotate(-90deg); }
    .score-ring-bg { stroke: rgba(255,255,255,.15); }
    .score-ring-fill { stroke: #e8436c; stroke-linecap: round; transition: stroke-dashoffset .8s ease; }
    .score-num {  font-size: 1.5rem; font-weight: 800; color: #fff; z-index: 1; }

    /* ── Section Label ── */
    .section-label {
       font-size: 11px; font-weight: 700;
      letter-spacing: .14em; text-transform: uppercase; color: var(--muted);
      margin: 2rem 0 .875rem;
    }

    /* ── Setting Card ── */
    .setting-card {
      background: var(--white); border-radius: 20px; border: 1.5px solid var(--border);
      box-shadow: var(--shadow-sm); overflow: hidden; margin-bottom: 1rem;
      transition: box-shadow .2s;
    }
    .setting-card:hover { box-shadow: var(--shadow-md); }
    .setting-card.active-card { border-color: var(--rose); }
    .setting-card.disabled-card { opacity: .55; pointer-events: none; }

    .sc-inner {
      display: flex; align-items: center; gap: 1.25rem; padding: 1.5rem;
    }
    .sc-icon {
      width: 52px; height: 52px; border-radius: 16px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .sc-icon mat-icon { font-size: 26px; width: 26px; height: 26px; }
    .sc-content { flex: 1; min-width: 0; }
    .sc-title {  font-size: .95rem; font-weight: 700; color: var(--ink); margin-bottom: .2rem; }
    .sc-desc { font-size: 13px; color: var(--muted); font-weight: 300; line-height: 1.5; }
    .sc-toggle { flex-shrink: 0; }
    .sc-badges { display: flex; align-items: center; gap: .5rem; margin-top: .5rem; }
    .badge-pill {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
    }
    .badge-pill.on { background: #d1fae5; color: #065f46; }
    .badge-pill.off { background: #fee2e2; color: #991b1b; }
    .badge-pill.soon { background: #f0f4fe; color: #4361ee; }
    .dot { width: 6px; height: 6px; border-radius: 50%; }
    .dot.on { background: var(--green); }
    .dot.off { background: #dc2626; }

    /* Warning block */
    .warning-block {
      margin: 0; padding: 1rem 1.5rem;
      background: #fff0f5; border-top: 1px solid #fce4ec;
      display: flex; align-items: flex-start; gap: .75rem;
    }
    .warning-block mat-icon { color: #c2185b; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }
    .warning-block p { margin: 0; font-size: 13px; color: #880e4f; line-height: 1.5; }
    .warning-block strong { font-weight: 600; }

    /* ── Activity Log ── */
    .log-card {
      background: var(--white); border-radius: 20px; border: 1.5px solid var(--border);
      box-shadow: var(--shadow-sm); overflow: hidden;
    }
    .log-header {
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
    }
    .log-title {  font-size: .95rem; font-weight: 700; color: var(--ink); }
    .log-see-all { font-size: 13px; color: var(--rose); cursor: pointer; font-weight: 500; }
    .log-list { padding: .5rem 0; }
    .log-item {
      display: flex; align-items: center; gap: 1rem;
      padding: .875rem 1.5rem; transition: background .15s;
    }
    .log-item:hover { background: var(--surface); }
    .log-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    }
    .log-icon-wrap {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .log-icon-wrap mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .log-text { flex: 1; }
    .log-action { font-size: 13px; color: var(--ink); font-weight: 500; }
    .log-time { font-size: 12px; color: var(--muted); }

    /* Spinner */
    .spinner-wrap { display: flex; justify-content: center; align-items: center; min-height: 24px; }
  `],
  template: `
    <div class="settings-page">

      <!-- Header -->
      <div class="page-eyebrow">Configuration</div>
      <h1 class="page-title">Paramètres de sécurité</h1>
      <p class="page-sub">Contrôlez les politiques d'accès et de sécurité de la plateforme</p>

      <!-- Security Score -->
      <div class="score-card">
        <div style="position:relative;z-index:1">
          <div class="score-label">Score de sécurité global</div>
          <div class="score-title">{{ twoFaEnabled ? 'Sécurité Renforcée' : 'Sécurité Standard' }}</div>
          <div class="score-desc">
            {{ twoFaEnabled
              ? 'La double authentification est active. Vos utilisateurs bénéficient d\'une protection maximale.'
              : 'Activez la 2FA pour renforcer la sécurité des comptes de vos utilisateurs.' }}
          </div>
        </div>
        <div class="score-ring">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle class="score-ring-bg" cx="40" cy="40" r="34" stroke-width="6" fill="none"/>
            <circle class="score-ring-fill" cx="40" cy="40" r="34" stroke-width="6" fill="none"
              stroke-dasharray="213.6"
              [attr.stroke-dashoffset]="twoFaEnabled ? 43 : 107"/>
          </svg>
          <span class="score-num">{{ twoFaEnabled ? '80' : '50' }}</span>
        </div>
      </div>

      <!-- Active Settings -->
      <div class="section-label">Paramètres actifs</div>

      <!-- 2FA Card -->
      <div class="setting-card" [class.active-card]="twoFaEnabled">
        <div class="sc-inner">
          <div class="sc-icon" [style.background]="twoFaEnabled ? '#fdf0f3' : '#faf8fc'">
            <mat-icon [style.color]="twoFaEnabled ? '#e8436c' : '#8b7d98'">lock</mat-icon>
          </div>
          <div class="sc-content">
            <div class="sc-title">Double authentification (2FA)</div>
            <div class="sc-desc">
              Tous les utilisateurs devront valider un code à usage unique envoyé par email à chaque connexion.
              Le code expire après 5 minutes.
            </div>
            <div class="sc-badges">
              <span class="badge-pill" [class.on]="twoFaEnabled" [class.off]="!twoFaEnabled">
                <span class="dot" [class.on]="twoFaEnabled" [class.off]="!twoFaEnabled"></span>
                {{ twoFaEnabled ? 'Activé' : 'Désactivé' }}
              </span>
              <span class="badge-pill soon">
                <mat-icon style="font-size:11px;width:11px;height:11px">shield</mat-icon>
                Haute priorité
              </span>
            </div>
          </div>
          <div class="sc-toggle">
            @if (loading) {
              <div class="spinner-wrap"><mat-spinner diameter="24" color="warn"></mat-spinner></div>
            } @else {
              <mat-slide-toggle [checked]="twoFaEnabled" color="warn" (change)="toggle2fa($event.checked)"></mat-slide-toggle>
            }
          </div>
        </div>
        @if (twoFaEnabled) {
          <div class="warning-block">
            <mat-icon>warning_amber</mat-icon>
            <p>
              <strong>2FA activé —</strong> Chaque utilisateur doit valider un code email lors de la connexion.
              Assurez-vous que votre service d'envoi d'emails est opérationnel pour éviter tout blocage de compte.
            </p>
          </div>
        }
      </div>

      <!-- Coming Soon Settings -->
      <div class="section-label">Bientôt disponible</div>

      <div class="setting-card disabled-card">
        <div class="sc-inner">
          <div class="sc-icon" style="background:#f5f3ff">
            <mat-icon style="color:#7c3aed">timer</mat-icon>
          </div>
          <div class="sc-content">
            <div class="sc-title">Expiration automatique des sessions</div>
            <div class="sc-desc">Déconnecter automatiquement les utilisateurs après une période d'inactivité configurable.</div>
            <div class="sc-badges"><span class="badge-pill soon">Bientôt disponible</span></div>
          </div>
          <div class="sc-toggle"><mat-slide-toggle disabled color="warn"></mat-slide-toggle></div>
        </div>
      </div>

      <div class="setting-card disabled-card">
        <div class="sc-inner">
          <div class="sc-icon" style="background:#f0fdf4">
            <mat-icon style="color:#16a34a">notifications_active</mat-icon>
          </div>
          <div class="sc-content">
            <div class="sc-title">Alertes de connexion suspecte</div>
            <div class="sc-desc">Envoyer une notification email si une connexion provient d'un nouvel appareil ou pays.</div>
            <div class="sc-badges"><span class="badge-pill soon">Bientôt disponible</span></div>
          </div>
          <div class="sc-toggle"><mat-slide-toggle disabled color="warn"></mat-slide-toggle></div>
        </div>
      </div>

      <div class="setting-card disabled-card">
        <div class="sc-inner">
          <div class="sc-icon" style="background:#fef8ec">
            <mat-icon style="color:#c9972b">vpn_key</mat-icon>
          </div>
          <div class="sc-content">
            <div class="sc-title">Politique de mot de passe renforcée</div>
            <div class="sc-desc">Imposer une complexité minimale et une rotation périodique des mots de passe utilisateurs.</div>
            <div class="sc-badges"><span class="badge-pill soon">Bientôt disponible</span></div>
          </div>
          <div class="sc-toggle"><mat-slide-toggle disabled color="warn"></mat-slide-toggle></div>
        </div>
      </div>

      <!-- Activity Log -->
      <div class="section-label">Journal d'activité sécurité</div>
      <div class="log-card">
        <div class="log-header">
          <div class="log-title">Événements récents</div>
          <span class="log-see-all">Voir tout →</span>
        </div>
        <div class="log-list">
          @for (log of activityLogs; track log.id) {
            <div class="log-item">
              <div class="log-dot" [style.background]="log.color"></div>
              <div class="log-icon-wrap" [style.background]="log.bgColor">
                <mat-icon [style.color]="log.color">{{ log.icon }}</mat-icon>
              </div>
              <div class="log-text">
                <div class="log-action">{{ log.action }}</div>
                <div class="log-time">{{ log.time }}</div>
              </div>
            </div>
          }
        </div>
      </div>

    </div>
  `
})
export class AdminSettingsComponent implements OnInit {
  twoFaEnabled = false;
  loading = true;

  activityLogs = [
    { id: 1, action: '2FA activé par admin@mama.tn', time: 'Il y a 2 heures', icon: 'lock', color: '#e8436c', bgColor: '#fdf0f3' },
    { id: 2, action: 'Connexion admin depuis 196.203.x.x (Tunis)', time: 'Il y a 3 heures', icon: 'login', color: '#16a34a', bgColor: '#f0fdf4' },
    { id: 3, action: 'Tentative échouée — compte user#482', time: 'Il y a 5 heures', icon: 'gpp_bad', color: '#c9972b', bgColor: '#fef8ec' },
    { id: 4, action: 'Paramètre mis à jour par admin@mama.tn', time: 'Hier, 14:22', icon: 'settings', color: '#7c3aed', bgColor: '#f5f3ff' },
    { id: 5, action: '2FA désactivé puis réactivé (maintenance)', time: 'Hier, 09:10', icon: 'lock_reset', color: '#4361ee', bgColor: '#f0f4fe' },
  ];

  constructor(private http: HttpClient, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/auth/2fa/status`).subscribe({
      next: (res) => { this.twoFaEnabled = res?.data?.enabled ?? false; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  toggle2fa(enabled: boolean): void {
    this.loading = true;
    this.http.post<any>(`${environment.apiUrl}/auth/2fa/toggle`, { enabled }).subscribe({
      next: () => {
        this.twoFaEnabled = enabled;
        this.loading = false;
        this.snack.open(enabled ? '✅ 2FA activé pour tous les utilisateurs' : '2FA désactivé', 'OK', { duration: 3000 });
      },
      error: () => { this.loading = false; this.snack.open('Erreur lors de la mise à jour.', 'OK', { duration: 3000 }); }
    });
  }
}