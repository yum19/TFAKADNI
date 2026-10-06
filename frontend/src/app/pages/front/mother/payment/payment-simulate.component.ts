import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { PlanConfigService } from '../../../../core/services/plan-config.service';
import { environment } from '../../../../../environments/environment';
 
@Component({
  selector: 'app-payment-simulate',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDividerModule],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
 
    :host { display: block; font-family: 'DM Sans', sans-serif; }
 
    .page {
      min-height: 100vh; display: flex;
      align-items: center; justify-content: center;
      padding: 2rem 1rem; position: relative;
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
      background: rgba(247,237,228,0.88); z-index: -1;
    }
 
    .card-wrap {
      width: 100%; max-width: 480px;
      position: relative; z-index: 1;
      animation: cardIn 0.5s ease both;
    }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
 
    /* Card shell */
    .pay-card {
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(16px);
      border: 1.5px solid rgba(255,255,255,0.8);
      border-radius: 28px; overflow: hidden;
      box-shadow: 0 8px 48px rgba(30,18,21,0.14);
    }
 
    /* Header */
    .card-header {
      background: linear-gradient(150deg, #1e1215 0%, #3d1a28 60%, #5c2038 100%);
      padding: 2.5rem 2rem 2rem;
      text-align: center; position: relative; overflow: hidden;
    }
    .card-header::before {
      content: '';
      position: absolute; top: -40px; right: -40px;
      width: 200px; height: 200px; border-radius: 50%;
      background: rgba(201,77,106,0.12);
    }
    .card-header::after {
      content: '';
      position: absolute; bottom: -30px; left: -30px;
      width: 120px; height: 120px; border-radius: 50%;
      background: rgba(201,77,106,0.08);
    }
    .header-icon-ring {
      width: 72px; height: 72px; border-radius: 50%;
      background: rgba(255,255,255,0.1);
      border: 2px solid rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1rem; font-size: 32px;
      position: relative; z-index: 1;
    }
    .header-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.6rem; font-weight: 700; color: white;
      margin-bottom: 4px; position: relative; z-index: 1;
    }
    .header-sub {
      font-size: 0.78rem; color: rgba(255,255,255,0.5);
      position: relative; z-index: 1; letter-spacing: 0.05em;
    }
    .demo-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255,165,0,0.2);
      border: 1px solid rgba(255,165,0,0.35);
      color: #fbbf24; border-radius: 20px;
      padding: 4px 14px; font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.08em; text-transform: uppercase;
      margin-top: 12px; position: relative; z-index: 1;
      display: inline-block;
    }
 
    /* Body */
    .card-body { padding: 2rem; }
 
    .section-label {
      font-size: 0.65rem; font-weight: 700;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: #c94d6a; margin-bottom: 1rem;
      display: flex; align-items: center; gap: 8px;
    }
    .section-label::after {
      content: '';
      flex: 1; height: 1px;
      background: linear-gradient(90deg, rgba(201,77,106,0.25), transparent);
    }
 
    /* Summary rows */
    .summary-row {
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(201,77,106,0.08);
      font-size: 0.88rem;
    }
    .summary-row:last-child { border: none; }
    .row-label { color: #7a5c65; }
    .row-value { font-weight: 600; color: #1e1215; }
    .row-value.discount { color: #10b981; }
    .row-value.upgrade  { color: #3a8fb5; }
    .promo-chip {
      display: inline-block;
      background: #d1fae5; color: #065f46;
      font-size: 0.65rem; font-weight: 700;
      padding: 2px 8px; border-radius: 6px;
      letter-spacing: 0.06em; margin-left: 6px;
    }
    .total-row {
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      background: #fff0f5;
      border-radius: 14px;
      border: 1.5px solid rgba(201,77,106,0.15);
      margin-top: 12px;
    }
    .total-label { font-size: 0.9rem; font-weight: 700; color: #1e1215; }
    .total-amount {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.6rem; font-weight: 700; color: #c94d6a;
    }
    .total-period { font-size: 0.72rem; color: #7a5c65; font-weight: 500; }
 
    /* Demo card */
    .demo-card-box {
      background: #f7ede4;
      border: 1.5px solid rgba(201,77,106,0.12);
      border-radius: 16px; padding: 1.25rem;
      margin: 1.25rem 0;
    }
    .demo-note {
      font-size: 0.75rem; color: #7a5c65;
      margin-bottom: 12px; display: flex; align-items: center; gap: 6px;
    }
    .fake-card-number {
      display: flex; align-items: center; gap: 10px;
      font-family: 'Courier New', monospace;
      font-size: 1rem; color: #4a3038;
      margin-bottom: 10px;
    }
    .card-icon { font-size: 22px; }
    .card-meta { display: flex; gap: 20px; }
    .card-field label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.08em; color: #7a5c65; display: block; margin-bottom: 2px; }
    .card-field span  { font-family: 'Courier New', monospace; font-size: 0.9rem; color: #1e1215; font-weight: 600; }
 
    /* Buttons */
    .btn-row { display: flex; gap: 10px; margin-top: 0; }
    .btn-cancel {
      flex: 1; padding: 13px;
      background: #f7ede4;
      border: 1.5px solid rgba(201,77,106,0.2);
      border-radius: 14px; color: #4a3038;
      font-size: 0.9rem; font-weight: 600;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-cancel:hover { border-color: #c94d6a; color: #c94d6a; }
    .btn-pay {
      flex: 2; padding: 13px;
      background: linear-gradient(135deg, #e8436c, #c94d6a);
      border: none; border-radius: 14px;
      color: white; font-size: 0.9rem; font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer; transition: all 0.2s;
      box-shadow: 0 4px 16px rgba(201,77,106,0.3);
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-pay:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(201,77,106,0.4); }
 
    /* Processing state */
    .processing-wrap {
      padding: 3.5rem 2rem; text-align: center;
    }
    .processing-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.5rem; font-weight: 700; color: #1e1215;
      margin: 1rem 0 6px;
    }
    .processing-sub { font-size: 0.88rem; color: #7a5c65; }
 
    /* Success */
    .success-icon-wrap {
      width: 80px; height: 80px; border-radius: 50%;
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
      border: 2px solid #10b981;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.25rem; font-size: 36px;
    }
    .success-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.8rem; font-weight: 700; color: #1e1215;
      margin-bottom: 6px;
    }
    .success-sub { font-size: 0.88rem; color: #7a5c65; line-height: 1.6; margin-bottom: 6px; }
    .success-amount {
      display: inline-block;
      background: #fff0f5;
      border: 1.5px solid rgba(201,77,106,0.2);
      border-radius: 12px; padding: 8px 20px;
      font-size: 0.88rem; font-weight: 600; color: #c94d6a;
      margin-bottom: 1.5rem;
    }
    .btn-full {
      width: 100%; padding: 14px;
      background: linear-gradient(135deg, #e8436c, #c94d6a);
      border: none; border-radius: 14px;
      color: white; font-size: 0.95rem; font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer; transition: all 0.2s;
      box-shadow: 0 4px 16px rgba(201,77,106,0.3);
    }
    .btn-full:hover { transform: translateY(-1px); }
  `],
  template: `
    <div class="page">
      <div class="card-wrap">
        <div class="pay-card">
 
          @if (!confirming) {
 
            <!-- Header -->
            <div class="card-header">
              <div class="header-icon-ring">💳</div>
              <div class="header-title">Paiement Sécurisé</div>
              <div class="header-sub">MAMAAI · Abonnement mensuel</div>
              <div class="demo-badge">⚡ Mode démonstration</div>
            </div>
 
            <div class="card-body">
 
              <!-- Summary -->
              <div class="section-label">Récapitulatif</div>
 
              <div class="summary-row">
                <span class="row-label">Plan</span>
                <span class="row-value">{{ planLabel }}</span>
              </div>
 
              @if (isUpgrade) {
                <div class="summary-row">
                  <span class="row-label">Prix {{ planLabel }}</span>
                  <span class="row-value">{{ originalAmount }} TND</span>
                </div>
                <div class="summary-row">
                  <span class="row-label">Votre plan actuel</span>
                  <span class="row-value upgrade">− {{ upgradeFrom }} TND</span>
                </div>
                <div class="summary-row">
                  <span class="row-label">↑ Différence à payer</span>
                  <span class="row-value" style="color:#3a8fb5">{{ originalAmount - upgradeFrom }} TND</span>
                </div>
              } @else {
                <div class="summary-row">
                  <span class="row-label">Prix initial</span>
                  <span class="row-value">{{ originalAmount }} TND</span>
                </div>
              }
 
              @if (discountPercent > 0) {
                <div class="summary-row">
                  <span class="row-label">Code promo <span class="promo-chip">{{ promoCode }}</span></span>
                  <span class="row-value discount">− {{ discountPercent }}%</span>
                </div>
              }
 
              <div class="total-row">
                <div>
                  <div class="total-label">Total à payer</div>
                  <div class="total-period">par mois · sans engagement</div>
                </div>
                <div class="total-amount">{{ finalAmount }} TND</div>
              </div>
 
              <!-- Demo card -->
              <div class="demo-card-box">
                <div class="demo-note">
                  ℹ️ Carte de test — aucun prélèvement réel
                </div>
                <div class="fake-card-number">
                  <span class="card-icon">💳</span>
                  •••• •••• •••• 4242
                </div>
                <div class="card-meta">
                  <div class="card-field">
                    <label>Expiration</label>
                    <span>12 / 26</span>
                  </div>
                  <div class="card-field">
                    <label>CVV</label>
                    <span>•••</span>
                  </div>
                  <div class="card-field">
                    <label>Titulaire</label>
                    <span>MAMAAI TEST</span>
                  </div>
                </div>
              </div>
 
              <div class="btn-row">
                <button class="btn-cancel" (click)="cancel()">Annuler</button>
                <button class="btn-pay" (click)="confirmPayment()">
                  🔒 Payer {{ finalAmount }} TND
                </button>
              </div>
 
            </div>
 
          } @else {
 
            <div class="processing-wrap">
              @if (!confirmed) {
                <mat-spinner diameter="52" style="margin:0 auto"></mat-spinner>
                <div class="processing-title">Traitement en cours...</div>
                <div class="processing-sub">Veuillez ne pas fermer cette page.</div>
              } @else {
                <div class="success-icon-wrap">✅</div>
                <div class="success-title">Paiement réussi ! 🎉</div>
                <div class="success-sub">
                  Votre abonnement <strong>{{ planLabel }}</strong> est maintenant actif.
                </div>
                <div class="success-amount">{{ finalAmount }} TND / mois</div>
                <button class="btn-full" (click)="router.navigate(['/mother/subscription'])">
                  Voir mon abonnement →
                </button>
              }
            </div>
 
          }
 
        </div>
      </div>
    </div>
  `,
})
export class PaymentSimulateComponent implements OnInit {
  ref = '';
  plan = '';
  planLabel = '';
  finalAmount = 0.0;
  originalAmount = 0.0;
  upgradeFrom = 0.0;
  discountPercent = 0;
  promoCode = '';
  isUpgrade = false;
  confirming = false;
  confirmed = false;
 
  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private http: HttpClient,
    private planConfigService: PlanConfigService
  ) {}
 
  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.ref = params.get('ref') ?? '';
    this.plan = params.get('plan') ?? '';
    this.discountPercent = parseInt(params.get('discount') ?? '0');
    this.promoCode = params.get('promo') ?? '';
    this.upgradeFrom = parseFloat(params.get('upgradeFrom') ?? '0');
    this.isUpgrade = this.upgradeFrom > 0;
 
    const amountFromUrl = parseFloat(params.get('amount') ?? '0');
    const originalFromUrl = parseFloat(params.get('original') ?? '0');
 
    if (amountFromUrl > 0 || originalFromUrl > 0) {
      this.finalAmount = amountFromUrl;
      this.originalAmount = originalFromUrl || amountFromUrl;
      this.planLabel = this.plan;
      this.planConfigService.getAll().subscribe({
        next: (res: any) => {
          const planConfig = res.data.find((p: any) => p.planKey === this.plan);
          if (planConfig) this.planLabel = planConfig.label;
        },
        error: () => {}
      });
    } else {
      this.planConfigService.getAll().subscribe({
        next: (res: any) => {
          const planConfig = res.data.find((p: any) => p.planKey === this.plan);
          if (planConfig) {
            this.planLabel = planConfig.label;
            const match = planConfig.price.match(/(\d+)/);
            const basePrice = match ? parseInt(match[1]) : 0;
            this.originalAmount = basePrice;
            this.finalAmount = this.discountPercent > 0
              ? Math.round(basePrice * (1 - this.discountPercent / 100))
              : basePrice;
          }
        },
        error: () => {
          this.planLabel = this.plan;
          this.finalAmount = amountFromUrl;
          this.originalAmount = originalFromUrl;
        }
      });
    }
  }
 
  confirmPayment(): void {
    this.confirming = true;
    let url = `${environment.apiUrl}/payments/confirm?ref=${this.ref}&plan=${this.plan}`;
    if (this.promoCode) url += `&promoCode=${this.promoCode}`;
    this.http.post<any>(url, {}).subscribe({
      next: () => { this.confirmed = true; },
      error: (err: any) => {
        this.confirming = false;
        alert(err?.error?.message ?? 'Erreur lors de la confirmation.');
      },
    });
  }
 
  cancel(): void { this.router.navigate(['/mother/payment/cancel']); }
}