import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
 
@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
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
      width: 100%; max-width: 440px;
      position: relative; z-index: 1;
      animation: cardIn 0.5s ease both;
    }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(20px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
 
    .cancel-card {
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(16px);
      border: 1.5px solid rgba(255,255,255,0.8);
      border-radius: 28px; overflow: hidden;
      box-shadow: 0 8px 48px rgba(30,18,21,0.12);
    }
 
    .card-header {
      background: linear-gradient(150deg, #2d1a1a 0%, #4a1a1a 60%, #6b1a1a 100%);
      padding: 2.5rem 2rem 2rem;
      text-align: center; position: relative; overflow: hidden;
    }
    .card-header::before {
      content: '';
      position: absolute; top: -50px; right: -50px;
      width: 200px; height: 200px; border-radius: 50%;
      background: rgba(239,68,68,0.1);
    }
    .icon-ring {
      width: 80px; height: 80px; border-radius: 50%;
      background: rgba(239,68,68,0.15);
      border: 2px solid rgba(239,68,68,0.3);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.25rem; font-size: 40px;
      position: relative; z-index: 1;
      animation: wobble 0.6s ease 0.3s both;
    }
    @keyframes wobble {
      0%   { transform: scale(0.5); opacity: 0; }
      70%  { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    .card-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.7rem; font-weight: 700; color: white;
      margin-bottom: 4px; position: relative; z-index: 1;
    }
    .card-sub {
      font-size: 0.8rem; color: rgba(255,255,255,0.45);
      position: relative; z-index: 1; letter-spacing: 0.04em;
    }
 
    .card-body { padding: 2rem; }
 
    .info-box {
      background: #fff5f5;
      border: 1.5px solid rgba(239,68,68,0.15);
      border-radius: 16px; padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .info-row {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 7px 0; font-size: 0.85rem; color: #4a3038;
      border-bottom: 1px solid rgba(239,68,68,0.08);
    }
    .info-row:last-child { border: none; padding-bottom: 0; }
    .info-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
 
    .btn-back {
      width: 100%; padding: 14px;
      background: linear-gradient(135deg, #e8436c, #c94d6a);
      border: none; border-radius: 14px;
      color: white; font-size: 0.95rem; font-weight: 700;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer; transition: all 0.2s;
      box-shadow: 0 4px 16px rgba(201,77,106,0.3);
      margin-bottom: 10px;
    }
    .btn-back:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(201,77,106,0.4); }
    .btn-secondary {
      width: 100%; padding: 13px;
      background: #f7ede4;
      border: 1.5px solid rgba(201,77,106,0.2);
      border-radius: 14px; color: #4a3038;
      font-size: 0.9rem; font-weight: 600;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-secondary:hover { border-color: #c94d6a; color: #c94d6a; }
  `],
  template: `
    <div class="page">
      <div class="card-wrap">
        <div class="cancel-card">
 
          <div class="card-header">
            <div class="icon-ring">❌</div>
            <div class="card-title">Paiement Annulé</div>
            <div class="card-sub">MAMAAI · Aucun montant débité</div>
          </div>
 
          <div class="card-body">
            <div class="info-box">
              <div class="info-row">
                <span class="info-icon">🛡️</span>
                <span>Aucun montant n'a été prélevé sur votre compte.</span>
              </div>
              <div class="info-row">
                <span class="info-icon">🔄</span>
                <span>Vous pouvez relancer votre abonnement à tout moment depuis votre espace.</span>
              </div>
              <div class="info-row">
                <span class="info-icon">💬</span>
                <span>Si vous avez rencontré un problème, contactez notre support.</span>
              </div>
            </div>
 
            <button class="btn-back" (click)="router.navigate(['/mother/subscription'])">
              Retour aux abonnements →
            </button>
            <button class="btn-secondary" (click)="router.navigate(['/mother/home'])">
              Retour à l'accueil
            </button>
          </div>
 
        </div>
      </div>
    </div>
  `,
})
export class PaymentCancelComponent {
  constructor(public router: Router) {}
}