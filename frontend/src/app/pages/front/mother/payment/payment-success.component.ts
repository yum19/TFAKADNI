import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
 
@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
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
      width: 100%; max-width: 460px;
      position: relative; z-index: 1;
      animation: cardIn 0.5s ease both;
    }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
 
    .status-card {
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(16px);
      border: 1.5px solid rgba(255,255,255,0.8);
      border-radius: 28px; overflow: hidden;
      box-shadow: 0 8px 48px rgba(30,18,21,0.12);
    }
 
    /* Loading state */
    .loading-wrap { padding: 4rem 2rem; text-align: center; }
    .loading-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.5rem; font-weight: 700; color: #1e1215;
      margin: 1.25rem 0 6px;
    }
    .loading-sub { font-size: 0.88rem; color: #7a5c65; }
    .loading-steps {
      display: flex; flex-direction: column; gap: 8px;
      margin-top: 1.5rem; text-align: left;
    }
    .step {
      display: flex; align-items: center; gap: 10px;
      font-size: 0.82rem; color: #7a5c65;
      background: #f7ede4; border-radius: 10px; padding: 8px 14px;
    }
    .step-icon { font-size: 14px; }
 
    /* Success state */
    .success-header {
      background: linear-gradient(150deg, #052e16 0%, #064e3b 60%, #065f46 100%);
      padding: 2.5rem 2rem 2rem;
      text-align: center; position: relative; overflow: hidden;
    }
    .success-header::before {
      content: '';
      position: absolute; top: -50px; right: -50px;
      width: 200px; height: 200px; border-radius: 50%;
      background: rgba(16,185,129,0.12);
    }
    .confetti-icon {
      font-size: 60px; display: block;
      margin-bottom: 12px;
      position: relative; z-index: 1;
      animation: bounceIn 0.6s ease both;
    }
    @keyframes bounceIn {
      0%   { transform: scale(0.3); opacity: 0; }
      60%  { transform: scale(1.15); opacity: 1; }
      100% { transform: scale(1); }
    }
    .success-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.8rem; font-weight: 700; color: white;
      margin-bottom: 4px; position: relative; z-index: 1;
    }
    .success-sub {
      font-size: 0.8rem; color: rgba(255,255,255,0.5);
      position: relative; z-index: 1;
    }
    .success-body { padding: 2rem; }
 
    .plan-pill {
      display: flex; align-items: center;
      justify-content: space-between;
      background: #f0fdf4;
      border: 1.5px solid rgba(16,185,129,0.25);
      border-radius: 16px; padding: 14px 18px;
      margin-bottom: 1.25rem;
    }
    .plan-name { font-weight: 700; color: #1e1215; font-size: 0.95rem; }
    .plan-status {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.75rem; font-weight: 700;
      color: #065f46;
      background: #d1fae5; border-radius: 10px;
      padding: 4px 10px;
    }
    .status-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #10b981;
      animation: blink 1.5s infinite;
    }
    @keyframes blink {
      0%,100% { opacity: 1; }
      50%      { opacity: 0.3; }
    }
 
    .features-list {
      display: flex; flex-direction: column; gap: 8px;
      margin-bottom: 1.5rem;
    }
    .feature-row {
      display: flex; align-items: center; gap: 10px;
      font-size: 0.85rem; color: #4a3038;
      padding: 8px 12px;
      background: #f7ede4;
      border-radius: 10px;
    }
    .feature-icon { font-size: 16px; }
 
    .btn-sub {
      width: 100%; padding: 14px;
      background: linear-gradient(135deg, #e8436c, #c94d6a);
      border: none; border-radius: 14px;
      color: white; font-size: 0.95rem; font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer; transition: all 0.2s;
      box-shadow: 0 4px 16px rgba(201,77,106,0.3);
    }
    .btn-sub:hover { transform: translateY(-1px); }
 
    /* Error state */
    .error-header {
      background: linear-gradient(150deg, #2d1a1a 0%, #4a1a1a 60%, #6b1a1a 100%);
      padding: 2.5rem 2rem 2rem;
      text-align: center; position: relative; overflow: hidden;
    }
    .error-icon {
      font-size: 60px; display: block;
      margin-bottom: 12px; position: relative; z-index: 1;
    }
    .error-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.8rem; font-weight: 700; color: white;
      margin-bottom: 4px; position: relative; z-index: 1;
    }
    .error-body { padding: 2rem; }
    .error-msg {
      background: #fff5f5;
      border: 1.5px solid rgba(239,68,68,0.15);
      border-radius: 14px; padding: 14px 18px;
      font-size: 0.88rem; color: #991b1b;
      margin-bottom: 1.5rem; line-height: 1.6;
    }
  `],
  template: `
    <div class="page">
      <div class="card-wrap">
        <div class="status-card">
 
          <!-- LOADING -->
          @if (loading) {
            <div class="loading-wrap">
              <mat-spinner diameter="52" style="margin:0 auto"></mat-spinner>
              <div class="loading-title">Confirmation en cours...</div>
              <div class="loading-sub">Vérification avec Flouci en cours.</div>
              <div class="loading-steps">
                <div class="step"><span class="step-icon">🔐</span> Vérification de la transaction</div>
                <div class="step"><span class="step-icon">✅</span> Activation de l'abonnement</div>
                <div class="step"><span class="step-icon">📧</span> Envoi de la confirmation</div>
              </div>
            </div>
          }
 
          <!-- SUCCESS -->
          @else if (success) {
            <div class="success-header">
              <span class="confetti-icon">🎉</span>
              <div class="success-title">Paiement réussi !</div>
              <div class="success-sub">MAMAAI · Abonnement activé</div>
            </div>
            <div class="success-body">
              <div class="plan-pill">
                <div>
                  <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:#7a5c65;margin-bottom:3px">Plan actif</div>
                  <div class="plan-name">{{ plan }}</div>
                </div>
                <div class="plan-status">
                  <div class="status-dot"></div>
                  Actif maintenant
                </div>
              </div>
 
              <div class="features-list">
                <div class="feature-row"><span class="feature-icon">🧬</span> Analyse IA de risque prénatal débloquée</div>
                <div class="feature-row"><span class="feature-icon">💗</span> Carte médicale personnalisée disponible</div>
                <div class="feature-row"><span class="feature-icon">📚</span> Accès complet à l'académie MAMAAI</div>
                <div class="feature-row"><span class="feature-icon">🔔</span> Suivi et rappels intelligents activés</div>
              </div>
 
              <button class="btn-sub" (click)="router.navigate(['/mother/subscription'])">
                Découvrir mon abonnement →
              </button>
            </div>
          }
 
          <!-- ERROR -->
          @else {
            <div class="error-header">
              <span class="error-icon">⚠️</span>
              <div class="error-title">Paiement non confirmé</div>
            </div>
            <div class="error-body">
              <div class="error-msg">{{ errorMessage }}</div>
                <button class="btn-sub" (click)="router.navigate(['/mother/subscription'])"></button>
            </div>
          }
 
        </div>
      </div>
    </div>
  `,
})
export class PaymentSuccessComponent implements OnInit {
  loading = true;
  success = false;
  plan = '';
  errorMessage = '';
 
  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private http: HttpClient
  ) {}
 
  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const paymentId = params.get('payment_id');
    const plan = params.get('plan') ?? sessionStorage.getItem('pending_plan') ?? 'PREMIUM';
    const promoCode = params.get('promo') ?? sessionStorage.getItem('pending_promo') ?? '';
    this.plan = plan;
 
    if (!paymentId) {
      this.loading = false;
      this.errorMessage = 'ID de paiement manquant. Veuillez contacter le support.';
      return;
    }
 
    let url = `${environment.apiUrl}/payments/confirm?paymentId=${paymentId}&plan=${plan}`;
    if (promoCode) url += `&promoCode=${promoCode}`;
 
    this.http.post<any>(url, {}).subscribe({
      next: () => {
        sessionStorage.removeItem('pending_plan');
        sessionStorage.removeItem('pending_promo');
        this.loading = false;
        this.success = true;
      },
      error: (err) => {
        this.loading = false;
        this.success = false;
        this.errorMessage = err?.error?.message ?? 'Le paiement n\'a pas pu être confirmé.';
      },
    });
  }
}