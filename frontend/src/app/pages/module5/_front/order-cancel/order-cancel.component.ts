// src/app/pages/shop/order-cancel/order-cancel.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-order-cancel',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="oc-page">
  <div class="oc-card">

    <!-- Animated X -->
    <div class="oc-circle">
      <svg class="oc-icon" viewBox="0 0 52 52">
        <circle class="oc-circle-bg" cx="26" cy="26" r="25" fill="none"/>
        <line class="oc-x1" x1="16" y1="16" x2="36" y2="36"/>
        <line class="oc-x2" x1="36" y1="16" x2="16" y2="36"/>
      </svg>
    </div>

    <h1 class="oc-title">Payment Cancelled</h1>
    <p class="oc-msg">
      Your payment was not completed.<br/>
      <strong>No charges</strong> were made to your account.
    </p>

    <div class="oc-actions">
      <button class="oc-btn-primary" (click)="retry()">Try Again</button>
      <button class="oc-btn-secondary" (click)="goShop()">Back to Shop</button>
    </div>
  </div>
</div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:wght@400;700&display=swap');

    :host {
      --pk: #ff4f75; --pk-d: #e0365a;
      --fd: 'Cormorant Garamond', Georgia, serif;
      --fb: 'DM Sans', system-ui, sans-serif;
    }

    .oc-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(160deg, #fff5f5 0%, #fff0f3 100%);
      font-family: var(--fb); padding: 24px;
    }
    .oc-card {
      background: white; border-radius: 28px; padding: 56px 48px;
      text-align: center; max-width: 440px; width: 100%;
      box-shadow: 0 20px 60px rgba(239,68,68,.1);
      border: 1.5px solid #fecaca;
      animation: cardIn .5s cubic-bezier(.2,.8,.3,1) both;
    }
    @keyframes cardIn { from { opacity:0; transform: translateY(24px) scale(.97); } to { opacity:1; transform:none; } }

    .oc-circle { width: 96px; height: 96px; margin: 0 auto 28px; }
    .oc-icon   { width: 96px; height: 96px; }
    .oc-circle-bg {
      stroke: #fecaca; stroke-width: 2;
      stroke-dasharray: 166; stroke-dashoffset: 166;
      animation: circleDraw .6s cubic-bezier(.65,0,.45,1) .1s forwards;
    }
    @keyframes circleDraw { to { stroke-dashoffset: 0; } }
    .oc-x1, .oc-x2 {
      stroke: #ef4444; stroke-width: 3; stroke-linecap: round;
      stroke-dasharray: 30; stroke-dashoffset: 30;
    }
    .oc-x1 { animation: lineDraw .3s ease .75s forwards; }
    .oc-x2 { animation: lineDraw .3s ease 1s forwards; }
    @keyframes lineDraw { to { stroke-dashoffset: 0; } }

    .oc-title { font-family: var(--fd); font-size: 2.2rem; color: #0f172a; margin: 0 0 10px; }
    .oc-msg   { font-size: .92rem; color: #64748b; line-height: 1.7; margin: 0 0 32px; }

    .oc-actions { display: flex; flex-direction: column; gap: 10px; }
    .oc-btn-primary {
      background: linear-gradient(135deg, var(--pk), var(--pk-d));
      color: white; border: none; padding: 14px; border-radius: 12px;
      font-size: .9rem; font-weight: 700; font-family: var(--fb); cursor: pointer;
      box-shadow: 0 6px 20px rgba(255,79,117,.35); transition: all .2s;
    }
    .oc-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(255,79,117,.45); }
    .oc-btn-secondary {
      background: none; border: 1.5px solid #e2e8f0; color: #64748b;
      padding: 13px; border-radius: 12px; font-size: .88rem; font-weight: 600;
      font-family: var(--fb); cursor: pointer; transition: all .15s;
    }
    .oc-btn-secondary:hover { border-color: var(--pk); color: var(--pk); }
  `],
})
export class OrderCancelComponent {
  constructor(private router: Router) {}
  retry():  void { this.router.navigate(['/shop/order']); }
  goShop(): void { this.router.navigate(['/shop']); }
}