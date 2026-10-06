import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { SubscriptionService } from '../../../../core/services/subscription.service';
import { PromoCodeService } from '../../../../core/services/promo-code.service';
import { PlanConfigService, PlanConfigResponse } from '../../../../core/services/plan-config.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../admin/admin-users.component';
import { PaymentService } from '../../../../core/services/payment.service';
import {
  SubscriptionResponse,
  InvoiceResponse,
  SubscriptionPlan,
  PromoCodeResponse,
} from '../../../../core/models/health.models';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressSpinnerModule,
    MatTableModule, MatSnackBarModule, MatDialogModule,
    MatInputModule, MatFormFieldModule,
  ],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

    :host {
      --gold:        #c94d6a;
      --gold-light:  #f5c6d0;
      --gold-pale:   #fdf0f3;
      --gold-bg:     rgba(201,77,106,0.10);
      --gold-border: rgba(201,77,106,0.25);
      --cream:       #f7ede4;
      --ink:         #1e1215;
      --ink-mid:     #4a3038;
      --ink-soft:    #7a5c65;
      --font-display: 'Playfair Display', Georgia, serif;
      --font-body:    'DM Sans', sans-serif;
      --radius-lg:   20px;
      --radius-xl:   28px;
      --shadow-card: 0 2px 16px rgba(30,18,21,0.10);
    }

    /* ── Page ── */
    .sub-page {
      min-height: 100vh;
      position: relative;
      font-family: var(--font-body);
    }
    .sub-page::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: url('/assets/img/mother_pages_background-3.png');
      background-size: cover;
      background-position: center;
      z-index: -1;
    }
    .sub-page::after {
      content: '';
      position: fixed;
      inset: 0;
      background: rgba(247, 237, 228, 0.85);
      z-index: -1;
    }

    .sub-wrap {
      position: relative;
      z-index: 1;
      max-width: 1400px;
      margin: 0 auto;
      padding: 3rem 2.5rem 4rem;
    }
    @media(max-width:600px){ .sub-wrap { padding: 2rem 1.5rem 3rem; } }

    /* ── Header ── */
    .sub-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2.5rem;
      margin-bottom: 2.5rem;
    }
    @media(max-width:900px){ .sub-header { flex-direction: column; align-items: flex-start; } }

    .header-badge {
      display: inline-block;
      font-family: var(--font-body);
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--gold);
      background: var(--gold-bg);
      border: 1.5px solid var(--gold-border);
      padding: 4px 14px;
      border-radius: 20px;
      margin-bottom: 1rem;
    }

    .sub-title {
      font-family: var(--font-display);
      font-size: clamp(2.4rem, 4.5vw, 3.8rem);
      font-weight: 700;
      line-height: 1.08;
      color: var(--ink);
      margin-bottom: 0.8rem;
    }
    .title-accent {
      font-style: italic;
      background: linear-gradient(135deg, #c94d6a, #e8758a, #c94d6a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .sub-lead {
      font-size: 0.95rem;
      color: var(--ink-mid);
      max-width: 460px;
      line-height: 1.7;
      margin-bottom: 1.5rem;
    }
    .trust-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .trust-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.70);
      border: 1.5px solid var(--gold-border);
      border-radius: 30px;
      padding: 6px 14px;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--ink-mid);
    }

    /* Hero Value Badge */
    .hero-value-wrap { flex-shrink: 0; }
    @media(max-width:900px){ .hero-value-wrap { display: none; } }
    .value-card {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1.5px solid var(--gold-border);
      border-radius: var(--radius-xl);
      padding: 24px 32px;
      text-align: center;
      box-shadow: var(--shadow-card);
    }
    .value-icon { font-size: 2rem; margin-bottom: 8px; }
    .value-num {
      font-family: var(--font-display);
      font-size: 2.6rem;
      font-weight: 700;
      color: var(--gold);
      line-height: 1;
    }
    .value-lbl {
      font-size: 0.68rem;
      color: var(--ink-soft);
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-top: 4px;
    }

    /* ── Section Meta ── */
    .section-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 1.5rem;
      margin-top: 2.5rem;
    }
    .section-chip {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--gold);
      background: var(--gold-bg);
      border: 1.5px solid var(--gold-border);
      padding: 3px 14px;
      border-radius: 20px;
      white-space: nowrap;
    }
    .section-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, var(--gold-border), transparent);
    }
    .section-count {
      font-size: 0.78rem;
      color: var(--ink-soft);
      font-weight: 600;
      white-space: nowrap;
    }

    /* ── Active Banner ── */
    .active-banner {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1.5px solid var(--gold-border);
      border-radius: var(--radius-xl);
      padding: 22px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      box-shadow: var(--shadow-card);
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .active-banner-left { display: flex; align-items: center; gap: 16px; }
    .active-icon {
      width: 52px; height: 52px;
      background: var(--gold-bg);
      border: 2px solid var(--gold-border);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px;
    }
    .active-plan-name {
      font-family: var(--font-display);
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--ink);
      margin-bottom: 3px;
    }
    .active-plan-dates {
      font-size: 0.78rem;
      color: var(--ink-soft);
    }
    .active-banner-right { display: flex; align-items: center; gap: 12px; }
    .status-pill {
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .status-pill.active { background: rgba(16,185,129,0.12); color: #059669; border: 1.5px solid rgba(16,185,129,0.3); }
    .status-pill.pending { background: rgba(245,158,11,0.12); color: #d97706; border: 1.5px solid rgba(245,158,11,0.3); }
    .status-pill.cancelled { background: rgba(239,68,68,0.12); color: #dc2626; border: 1.5px solid rgba(239,68,68,0.25); }

    .btn-cancel {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px;
      background: rgba(239,68,68,0.08);
      border: 1.5px solid rgba(239,68,68,0.25);
      color: #dc2626;
      border-radius: 30px;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-body);
      transition: all 0.2s;
    }
    .btn-cancel:hover { background: rgba(239,68,68,0.15); }
    .btn-cancel:disabled { opacity: 0.5; cursor: default; }

    /* ── Promo Card ── */
    .promo-card {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-xl);
      padding: 24px 28px;
      box-shadow: var(--shadow-card);
    }
    .promo-title {
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--ink);
      margin-bottom: 16px;
      display: flex; align-items: center; gap: 10px;
    }
    .promo-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      flex-wrap: wrap;
    }
    .promo-row mat-form-field { flex: 1; min-width: 200px; }

    .btn-apply {
      padding: 11px 22px;
      background: linear-gradient(135deg, var(--gold-bg), rgba(247, 237, 228, 0.15));
      border: 1.5px solid var(--gold-border);
      color: var(--gold);
      border-radius: 12px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-body);
      transition: all 0.2s;
      white-space: nowrap;
    }
    .btn-apply:hover:not(:disabled) { background: linear-gradient(135deg, rgba(201,77,106,0.25), rgba(201,77,106,0.20)); }
    .btn-apply:disabled { opacity: 0.5; cursor: default; }
    .btn-clear {
      padding: 11px 18px;
      background: transparent;
      border: 1.5px solid rgba(26,18,6,0.15);
      color: var(--ink-soft);
      border-radius: 12px;
      font-size: 0.82rem;
      cursor: pointer;
      font-family: var(--font-body);
      transition: all 0.2s;
    }
    .btn-clear:hover { background: rgba(0,0,0,0.04); }

    .promo-success {
      display: flex; align-items: center; gap: 10px;
      background: rgba(16,185,129,0.08);
      border: 1.5px solid rgba(16,185,129,0.25);
      border-radius: 12px;
      padding: 10px 14px;
      margin-top: 12px;
      font-size: 0.82rem;
      color: #059669;
      font-weight: 600;
    }
    .promo-error {
      font-size: 0.78rem;
      color: #dc2626;
      margin-top: 8px;
      font-weight: 500;
    }

    /* ── Material overrides ── */
    ::ng-deep .sub-page .mat-mdc-form-field {
      --mdc-outlined-text-field-outline-color: rgba(201,77,106,0.25);
      --mdc-outlined-text-field-focus-outline-color: rgba(201,77,106,0.65);
      --mdc-outlined-text-field-label-text-color: var(--ink-soft);
      --mdc-outlined-text-field-input-text-color: var(--ink);
    }

    /* ── Plans Grid ── */
    .plans-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.2rem;
    }
    @media(max-width:900px){ .plans-grid { grid-template-columns: 1fr; } }

    /* Plan Card */
    .plan-card {
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-xl);
      padding: 2rem 1.6rem;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-card);
      position: relative;
      overflow: hidden;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
      animation: scaleIn 0.5s ease both;
    }
    .plan-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, var(--gold), transparent);
      opacity: 0;
      transition: opacity 0.3s;
    }
    .plan-card:hover { transform: translateY(-5px); box-shadow: 0 8px 32px rgba(201,77,106,0.18); }
    .plan-card:hover::before { opacity: 1; }
    .plan-card.is-active {
      border-color: var(--gold-border);
      background: linear-gradient(145deg, rgba(255,255,255,0.92), rgba(245,224,176,0.25));
    }
    .plan-card.is-active::before { opacity: 1; }
    .plan-card.is-popular { border-color: var(--gold-border); }

    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to   { opacity: 1; transform: scale(1); }
    }

    .popular-badge {
      position: absolute;
      top: 0; right: 20px;
      background: linear-gradient(135deg, var(--gold), #c94d6a);
      color: #fff;
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 0 0 10px 10px;
    }

    .plan-icon { font-size: 2.2rem; margin-bottom: 12px; }
    .plan-name {
      font-family: var(--font-display);
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--ink);
      margin-bottom: 6px;
    }
    .plan-price {
      font-family: var(--font-display);
      font-size: 2.2rem;
      font-weight: 700;
      color: var(--gold);
      line-height: 1;
      margin-bottom: 4px;
    }
    .plan-price-orig {
      font-size: 0.82rem;
      color: var(--ink-soft);
      text-decoration: line-through;
      margin-bottom: 4px;
    }
    .plan-upgrade-diff {
      font-size: 0.75rem;
      color: #059669;
      margin-bottom: 1.2rem;
      display: flex; align-items: center; gap: 4px;
      font-weight: 600;
    }
    .plan-features {
      list-style: none;
      padding: 0;
      margin: 0 0 1.5rem;
      flex: 1;
    }
    .plan-feature {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 0.82rem;
      color: var(--ink-mid);
      margin-bottom: 9px;
      line-height: 1.5;
    }
    .feat-check { color: var(--gold); flex-shrink: 0; font-size: 0.9rem; }

    .btn-plan {
      width: 100%;
      padding: 11px 20px;
      border-radius: 30px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-body);
      transition: all 0.22s;
      display: flex; align-items: center; justify-content: center; gap: 7px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border: none;
    }
    .btn-plan.primary {
      background: linear-gradient(135deg, var(--gold), #c94d6a);
      color: #fff;
    }
    .btn-plan.primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #e8758a, #c94d6a);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(201,77,106,0.35);
    }
    .btn-plan.outline {
      background: rgba(26,18,6,0.05);
      border: 1.5px solid rgba(26,18,6,0.15);
      color: var(--ink-soft);
    }
    .btn-plan.outline:hover:not(:disabled) { background: rgba(26,18,6,0.08); }
    .btn-plan.current {
      background: var(--gold-bg);
      border: 1.5px solid var(--gold-border);
      color: var(--gold);
      cursor: default;
    }
    .btn-plan:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Guarantee Strip ── */
    .guarantee-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-top: 1.5rem;
    }
    @media(max-width:700px){ .guarantee-strip { grid-template-columns: 1fr; } }
    .guarantee-item {
      background: rgba(255,255,255,0.80);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-lg);
      padding: 1.2rem 1.4rem;
      text-align: center;
      box-shadow: var(--shadow-card);
    }
    .guarantee-icon { font-size: 1.6rem; margin-bottom: 8px; }
    .guarantee-title {
      font-family: var(--font-display);
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--ink);
      margin-bottom: 5px;
    }
    .guarantee-text { font-size: 0.75rem; color: var(--ink-soft); line-height: 1.5; }

    /* ── Invoices ── */
    .invoices-panel {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.75);
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }
    .invoice-row {
      display: grid;
      grid-template-columns: 80px 1fr 120px 120px 100px;
      gap: 12px;
      padding: 12px 20px;
      align-items: center;
      border-bottom: 1px solid rgba(201,77,106,0.10);
      font-size: 0.82rem;
      color: var(--ink-mid);
      transition: background 0.15s;
    }
    .invoice-row:last-child { border-bottom: none; }
    .invoice-row.head {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--ink-soft);
      background: var(--gold-bg);
    }
    .invoice-row:not(.head):hover { background: rgba(201,77,106,0.04); }
    .inv-id { font-weight: 700; color: var(--gold); }
    .inv-date { color: var(--ink-mid); }
    .inv-amount { font-weight: 700; color: var(--ink); }
    .inv-provider {
      background: var(--gold-bg);
      border: 1px solid var(--gold-border);
      color: var(--gold);
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 0.68rem;
      font-weight: 700;
      text-align: center;
    }
    .btn-dl {
      padding: 5px 12px;
      background: rgba(255,255,255,0.90);
      border: 1.5px solid var(--gold-border);
      color: var(--gold);
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-body);
      transition: all 0.2s;
    }
    .btn-dl:hover { background: var(--gold-bg); }

    /* Loading */
    .loading-state {
      text-align: center;
      padding: 80px 20px;
    }
    .loading-orb {
      width: 60px; height: 60px;
      border: 3px solid var(--gold-border);
      border-top-color: var(--gold);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-state p { color: var(--ink-soft); font-size: 0.88rem; }
  `],
  template: `
    <section class="sub-page">
      <div class="sub-wrap">

        <!-- ── Header ── -->
        <header class="sub-header">
          <div class="header-copy">
            <span class="header-badge">✦ Espace Premium</span>
            <h1 class="sub-title">
              Votre parcours,<br />
              <span class="title-accent">Sans limites.</span>
            </h1>
            <p class="sub-lead">
              Choisissez le plan qui accompagne chaque étape de votre grossesse.
              Accès illimité aux cours, à l'IA santé et au suivi personnalisé.
            </p>
            <div class="trust-row">
              <span class="trust-badge">🔒 Paiement sécurisé</span>
              <span class="trust-badge">↩️ Annulation libre</span>
              <span class="trust-badge">🌟 Support 7j/7</span>
            </div>
          </div>
          <div class="hero-value-wrap">
            <div class="value-card">
              <div class="value-icon">👑</div>
              <div class="value-num">3</div>
              <div class="value-lbl">Plans disponibles</div>
            </div>
          </div>
        </header>

        <!-- Loading -->
        <div *ngIf="loading" class="loading-state">
          <div class="loading-orb"></div>
          <p>Chargement de votre abonnement...</p>
        </div>

        <div *ngIf="!loading">

          <!-- ── Active Subscription Banner ── -->
          <ng-container *ngIf="activeSub">
            <div class="section-meta">
              <span class="section-chip">Abonnement actif</span>
              <div class="section-line"></div>
              <span class="section-count">Renouvelé automatiquement</span>
            </div>
            <div class="active-banner">
              <div class="active-banner-left">
                <div class="active-icon">{{ getPlanIcon(activeSub.plan) }}</div>
                <div>
                  <div class="active-plan-name">Plan {{ activeSub.plan }}</div>
                  <div class="active-plan-dates">
                    Depuis le {{ activeSub.startDate | date:'dd/MM/yyyy' }}
                    <ng-container *ngIf="activeSub.endDate">
                      · Expire le {{ activeSub.endDate | date:'dd/MM/yyyy' }}
                    </ng-container>
                  </div>
                </div>
              </div>
              <div class="active-banner-right">
                <span class="status-pill" [ngClass]="activeSub.status?.toLowerCase() ?? 'active'">
                  {{ activeSub.status ?? 'Actif' }}
                </span>
                <button class="btn-cancel" [disabled]="cancelling" (click)="cancelSubscription()">
                  <ng-container *ngIf="cancelling">⏳</ng-container>
                  {{ cancelling ? 'Annulation...' : '✕ Annuler' }}
                </button>
              </div>
            </div>
          </ng-container>

          <!-- ── Promo Code ── -->
          <div class="section-meta">
            <span class="section-chip">Code Promo</span>
            <div class="section-line"></div>
          </div>
          <div class="promo-card">
            <div class="promo-title">🎟️ Appliquer un code de réduction</div>
            <div class="promo-row">
              <mat-form-field appearance="outline">
                <mat-label>Votre code promo</mat-label>
                <input matInput [formControl]="promoCtrl" placeholder="MAMA2024" [disabled]="!!appliedPromo" />
              </mat-form-field>
              <button class="btn-apply" *ngIf="!appliedPromo" (click)="validatePromo()" [disabled]="validatingPromo || !promoCtrl.value">
                {{ validatingPromo ? '...' : 'Appliquer' }}
              </button>
              <button class="btn-clear" *ngIf="appliedPromo" (click)="clearPromo()">✕ Retirer</button>
            </div>
            <div class="promo-error" *ngIf="promoError">⚠️ {{ promoError }}</div>
            <div class="promo-success" *ngIf="appliedPromo">
              ✅ Code <strong>{{ appliedPromo.code }}</strong> appliqué — {{ getPromoDiscount() }}% de réduction !
            </div>
          </div>

          <!-- ── Plans ── -->
          <div class="section-meta">
            <span class="section-chip">Nos plans</span>
            <div class="section-line"></div>
            <span class="section-count">{{ plans.length }} formules</span>
          </div>

          <div class="plans-grid">
            <div class="plan-card"
              *ngFor="let plan of plans"
              [class.is-popular]="plan.planKey === 'PREMIUM'"
              [class.is-active]="activeSub?.plan === plan.planKey">

              <div class="popular-badge" *ngIf="plan.planKey === 'PREMIUM'">⭐ Populaire</div>

              <div class="plan-icon">{{ getPlanIcon(plan.planKey) }}</div>
              <div class="plan-name">{{ plan.planKey }}</div>

              <div class="plan-price-orig" *ngIf="appliedPromo && plan.planKey !== 'FREE'">{{ plan.price }}</div>
              <div class="plan-price">{{ getPriceWithDiscount(plan) }}</div>
              <div class="plan-upgrade-diff" *ngIf="getUpgradeDiff(plan) > 0">
                ↑ Différence : +{{ getUpgradeDiff(plan) }} TND
              </div>

              <ul class="plan-features">
                <li class="plan-feature" *ngFor="let f of plan.features">
                  <span class="feat-check">✦</span>{{ f }}
                </li>
              </ul>

              <button class="btn-plan"
                [class.primary]="activeSub?.plan !== plan.planKey && !isDowngrade(plan)"
                [class.outline]="isDowngrade(plan)"
                [class.current]="activeSub?.plan === plan.planKey"
                [disabled]="activeSub?.plan === plan.planKey || isDowngrade(plan) || subscribing"
                (click)="choosePlan(asSubscriptionPlan(plan.planKey))">
                <mat-spinner *ngIf="subscribing && selectedPlan === plan.planKey" diameter="14"
                  style="--mdc-circular-progress-active-indicator-color:#fff;display:inline-block"></mat-spinner>
                {{ getPlanButtonLabel(plan) }}
              </button>
            </div>
          </div>

          <!-- ── Guarantees ── -->
          <div class="guarantee-strip">
            <div class="guarantee-item">
              <div class="guarantee-icon">🔒</div>
              <div class="guarantee-title">Paiement sécurisé</div>
              <div class="guarantee-text">Toutes les transactions sont chiffrées SSL et sécurisées.</div>
            </div>
            <div class="guarantee-item">
              <div class="guarantee-icon">↩️</div>
              <div class="guarantee-title">Annulation libre</div>
              <div class="guarantee-text">Annulez à tout moment, sans frais ni engagement.</div>
            </div>
            <div class="guarantee-item">
              <div class="guarantee-icon">🌟</div>
              <div class="guarantee-title">Support prioritaire</div>
              <div class="guarantee-text">Accédez à notre équipe médicale 7j/7 en Premium.</div>
            </div>
          </div>

          <!-- ── Invoices ── -->
          <ng-container *ngIf="invoices.length > 0">
            <div class="section-meta">
              <span class="section-chip">Factures</span>
              <div class="section-line"></div>
              <span class="section-count">{{ invoices.length }} facture(s)</span>
            </div>
            <div class="invoices-panel">
              <div class="invoice-row head">
                <span>#ID</span><span>Date</span><span>Montant</span><span>Paiement</span><span>PDF</span>
              </div>
              <div class="invoice-row" *ngFor="let inv of invoices">
                <span class="inv-id">#{{ inv.id }}</span>
                <span class="inv-date">{{ inv.createdAt | date:'dd/MM/yyyy' }}</span>
                <span class="inv-amount">{{ inv.amount | number:'1.2-2' }} {{ inv.currency }}</span>
                <span class="inv-provider">{{ inv.paymentProvider }}</span>
                <button class="btn-dl" (click)="downloadPdf(inv.id)">⬇️ PDF</button>
              </div>
            </div>
          </ng-container>

        </div>
      </div>
    </section>
  `
})
export class SubscriptionComponent implements OnInit {
  loading = true;
  activeSub: SubscriptionResponse | null = null;
  invoices: InvoiceResponse[] = [];
  plans: PlanConfigResponse[] = [];
  subscribing = false;
  selectedPlan: string | null = null;
  cancelling = false;
  promoCtrl = new FormControl('');
  promoError = '';
  appliedPromo: PromoCodeResponse | null = null;
  validatingPromo = false;

  private planOrder: Record<string, number> = { FREE: 0, PREMIUM: 1, PRO: 2 };

  constructor(
    private authService: AuthService,
    private subscriptionService: SubscriptionService,
    private promoCodeService: PromoCodeService,
    private planConfigService: PlanConfigService,
    private paymentService: PaymentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) return;
    this.planConfigService.getAll().subscribe({ next: (res) => (this.plans = res.data), error: () => {} });
    this.subscriptionService.getActiveSubscription(user.id).subscribe({
      next: (res) => (this.activeSub = res.data), error: () => (this.activeSub = null),
    });
    this.subscriptionService.getInvoices(user.id).subscribe({
      next: (res) => { this.invoices = res.data; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  getPlanIcon(planKey: string): string {
    const icons: Record<string, string> = { FREE: '🌱', PREMIUM: '💎', PRO: '👑' };
    return icons[planKey] || '📦';
  }

  isDowngrade(plan: PlanConfigResponse): boolean {
    if (!this.activeSub || this.activeSub.plan === 'FREE') return false;
    return (this.planOrder[plan.planKey] ?? 0) < (this.planOrder[this.activeSub.plan] ?? 0);
  }

  getUpgradeDiff(plan: PlanConfigResponse): number {
    if (!this.activeSub || plan.planKey === 'FREE') return 0;
    if ((this.planOrder[plan.planKey] ?? 0) <= (this.planOrder[this.activeSub.plan] ?? 0)) return 0;
    const currentPlan = this.plans.find(p => p.planKey === this.activeSub!.plan);
    if (!currentPlan) return 0;
    const parsePrice = (value: string | number): number => {
      if (typeof value === 'number') return value;
      const match = value.replace(',', '.').match(/^(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    };
    const curPrice = parsePrice(currentPlan.price);
    const tarPrice = parsePrice(plan.price);
    return Math.max(0, Math.round(tarPrice - curPrice));
  }

  getPlanButtonLabel(plan: PlanConfigResponse): string {
    if (this.activeSub?.plan === plan.planKey) return '✓ Plan actuel';
    if (this.isDowngrade(plan)) return '↓ Non disponible';
    if (this.getUpgradeDiff(plan) > 0) return `↑ Upgrader (+${this.getUpgradeDiff(plan)} TND)`;
    return 'Choisir ce plan';
  }

  asSubscriptionPlan(key: string): SubscriptionPlan { return key as SubscriptionPlan; }

  getPromoDiscount(): number {
    if (!this.appliedPromo) return 0;
    const promo = this.appliedPromo as any;
    return promo.discountPercent ?? promo.discountPct ?? 0;
  }

  getPriceWithDiscount(plan: PlanConfigResponse): string {
    const parsePrice = (value: string | number): number => {
      if (typeof value === 'number') return value;
      const match = value.replace(',', '.').match(/^(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : NaN;
    };

    if (!this.appliedPromo || plan.planKey === 'FREE') {
      return typeof plan.price === 'number' ? `${plan.price} TND` : plan.price;
    }

    const price = parsePrice(plan.price);
    if (Number.isNaN(price)) {
      return typeof plan.price === 'number' ? `${plan.price} TND` : plan.price;
    }

    const discountPercent = this.getPromoDiscount();
    const discounted = price * (1 - discountPercent / 100);
    return `${discounted.toFixed(2)} TND`;
  }

  validatePromo(): void {
    const code = this.promoCtrl.value?.trim();
    if (!code) return;
    this.validatingPromo = true; this.promoError = ''; this.appliedPromo = null;
    this.promoCodeService.validateCode({ code, plan: 'PREMIUM' }).subscribe({
      next: (res) => {
        const promo = res.data as any;
        const discount = promo.discountPercent ?? promo.discountPct ?? 0;
        this.appliedPromo = { ...res.data, discountPercent: discount };
        this.validatingPromo = false;
        this.snackBar.open(`Code ${res.data.code} appliqué — ${discount}% de réduction !`, 'OK', { duration: 4000 });
      },
      error: (err) => { this.validatingPromo = false; this.promoError = err?.error?.message ?? 'Code invalide ou expiré.'; },
    });
  }

  clearPromo(): void { this.appliedPromo = null; this.promoCtrl.setValue(''); this.promoError = ''; }

  choosePlan(plan: SubscriptionPlan): void {
    const user = this.authService.currentUser();
    if (!user) return;
    this.subscribing = true; this.selectedPlan = plan;
    if (plan === 'FREE') {
      this.subscriptionService.subscribe(user.id, { plan }).subscribe({
        next: (res) => { this.activeSub = res.data; this.subscribing = false; this.selectedPlan = null; this.clearPromo(); this.snackBar.open('Plan FREE activé ✓', 'OK', { duration: 3000 }); },
        error: (err) => { this.subscribing = false; this.selectedPlan = null; this.snackBar.open(err?.error?.message ?? 'Erreur.', 'Fermer', { duration: 4000 }); },
      });
      return;
    }
    this.paymentService.checkout({ plan, promoCode: this.appliedPromo?.code }).subscribe({
      next: (res: any) => {
        this.subscribing = false; this.selectedPlan = null;
        if (res.data.paymentUrl) {
          if (this.appliedPromo?.code) sessionStorage.setItem('pending_promo', this.appliedPromo.code);
          sessionStorage.setItem('pending_plan', plan);
          // Fix: Remove '/api' prefix from the URL if it exists
          let redirectUrl = res.data.paymentUrl;
          if (redirectUrl.includes('/api/mother/')) {
            redirectUrl = redirectUrl.replace('/api/mother/', '/mother/');
          }
          console.log('Redirecting to:', redirectUrl);
          window.location.href = redirectUrl;
        }
      },
      error: (err: any) => { this.subscribing = false; this.selectedPlan = null; this.snackBar.open(err?.error?.message ?? 'Erreur paiement.', 'Fermer', { duration: 4000 }); },
    });
  }

  cancelSubscription(): void {
    if (!this.activeSub) return;
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { title: 'Annuler l\'abonnement', message: `Voulez-vous vraiment annuler votre plan ${this.activeSub.plan} ?`, confirmLabel: 'Annuler l\'abonnement' }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.cancelling = true;
      this.subscriptionService.cancelSubscription(this.activeSub!.id).subscribe({
        next: () => { this.activeSub = null; this.cancelling = false; this.snackBar.open('Abonnement annulé.', 'OK', { duration: 3000 }); },
        error: (err) => { this.cancelling = false; this.snackBar.open(err?.error?.message ?? 'Erreur.', 'Fermer', { duration: 4000 }); },
      });
    });
  }

  downloadPdf(invoiceId: number): void {
    this.subscriptionService.downloadInvoicePdf(invoiceId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `facture-${invoiceId}.pdf`; a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Impossible de télécharger la facture.', 'Fermer', { duration: 3000 }),
    });
  }
}