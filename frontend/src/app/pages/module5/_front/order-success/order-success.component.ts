// src/app/pages/shop/order-success/order-success.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CartService }       from '../../../../core/services/cart.service';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="os-page">
  <div class="os-card">

    <!-- Animated checkmark -->
    <div class="os-circle">
      <svg class="os-check" viewBox="0 0 52 52">
        <circle class="os-circle-bg" cx="26" cy="26" r="25" fill="none"/>
        <path  class="os-checkmark"  fill="none" stroke-linecap="round" stroke-linejoin="round" d="M14 27l8 8 16-16"/>
      </svg>
    </div>

    <h1 class="os-title">Payment Successful!</h1>
    <p class="os-msg">
      Your order has been confirmed. 🎉<br/>
      You'll receive an <strong>SMS</strong> shortly with your order details.
    </p>

    <div class="os-session" *ngIf="sessionId">
      <span class="os-session-lbl">Reference</span>
      <span class="os-session-val">{{ sessionId }}</span>
    </div>

    <div class="os-actions">
      <button class="os-btn-primary" (click)="goShop()">Continue Shopping</button>
      <button class="os-btn-secondary" (click)="goOrders()">My Orders</button>
    </div>
  </div>
</div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:wght@400;700&display=swap');

    :host {
      --pk: #ff4f75; --pk-d: #e0365a; --pk-l: #fff0f3;
      --green: #16a34a; --green-l: #f0fdf4;
      --fd: 'Cormorant Garamond', Georgia, serif;
      --fb: 'DM Sans', system-ui, sans-serif;
    }

    .os-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(160deg, #f0fdf4 0%, #fff0f3 100%);
      font-family: var(--fb); padding: 24px;
    }
    .os-card {
      background: white; border-radius: 28px; padding: 56px 48px;
      text-align: center; max-width: 480px; width: 100%;
      box-shadow: 0 20px 60px rgba(22,163,74,.12);
      border: 1.5px solid #bbf7d0;
      animation: cardIn .5s cubic-bezier(.2,.8,.3,1) both;
    }
    @keyframes cardIn { from { opacity:0; transform: translateY(24px) scale(.97); } to { opacity:1; transform: none; } }

    /* ── Animated checkmark ── */
    .os-circle {
      width: 96px; height: 96px; margin: 0 auto 28px;
    }
    .os-check { width: 96px; height: 96px; }
    .os-circle-bg {
      stroke: #bbf7d0; stroke-width: 2;
      stroke-dasharray: 166; stroke-dashoffset: 166;
      animation: circleDraw .6s cubic-bezier(.65,0,.45,1) .1s forwards;
    }
    @keyframes circleDraw { to { stroke-dashoffset: 0; } }
    .os-checkmark {
      stroke: var(--green); stroke-width: 3;
      stroke-dasharray: 48; stroke-dashoffset: 48;
      animation: checkDraw .4s cubic-bezier(.65,0,.45,1) .7s forwards;
    }
    @keyframes checkDraw { to { stroke-dashoffset: 0; } }

    .os-title { font-family: var(--fd); font-size: 2.2rem; color: #0f172a; margin: 0 0 10px; }
    .os-msg   { font-size: .92rem; color: #475569; line-height: 1.7; margin: 0 0 24px; }

    .os-session {
      display: inline-flex; flex-direction: column; gap: 2px;
      background: var(--green-l); border: 1.5px solid #bbf7d0;
      border-radius: 12px; padding: 10px 20px; margin-bottom: 28px;
    }
    .os-session-lbl { font-size: .67rem; font-weight: 700; color: var(--green); text-transform: uppercase; letter-spacing: .6px; }
    .os-session-val { font-size: .78rem; color: #166534; word-break: break-all; }

    .os-actions { display: flex; flex-direction: column; gap: 10px; }
    .os-btn-primary {
      background: linear-gradient(135deg, var(--pk), var(--pk-d));
      color: white; border: none; padding: 14px; border-radius: 12px;
      font-size: .9rem; font-weight: 700; font-family: var(--fb); cursor: pointer;
      box-shadow: 0 6px 20px rgba(255,79,117,.35); transition: all .2s;
    }
    .os-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(255,79,117,.45); }
    .os-btn-secondary {
      background: none; border: 1.5px solid #e2e8f0; color: #64748b;
      padding: 13px; border-radius: 12px; font-size: .88rem; font-weight: 600;
      font-family: var(--fb); cursor: pointer; transition: all .15s;
    }
    .os-btn-secondary:hover { border-color: var(--pk); color: var(--pk); }
  `],
})
export class OrderSuccessComponent implements OnInit {
  sessionId = '';

  constructor(
    private route:    ActivatedRoute,
    private router:   Router,
    private cartSvc:  CartService,
  ) {}

  ngOnInit(): void {
    // Clear the cart on successful payment
    this.cartSvc.clear();
    // Grab session_id from Stripe redirect URL
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id') ?? '';
  }

  goShop():   void { this.router.navigate(['/mother/shop']); }
  goOrders(): void { this.router.navigate(['/mother/shop']); }
}