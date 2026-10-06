// src/app/pages/shop/commande/commande.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { Router }            from '@angular/router';
import { CartService, CartItem } from '../../../../core/services/cart.service';
import {
  CheckoutService,
  CheckoutRequest,
  PaymentIntentResponse,
} from '../../../../core/services/checkout.service';

declare const Stripe: any;

@Component({
  selector: 'app-commande',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="co-page">

  <!-- Left: order summary -->
  <div class="co-summary">
    <h2 class="co-summary-title"><span class="co-icon">🛍️</span> Your Order</h2>

    <div class="co-items">
      <div *ngFor="let item of items" class="co-item">
        <div class="co-item-img">
          <img *ngIf="item.produit.images?.length" [src]="item.produit.images![0]" [alt]="item.produit.nom" />
          <div *ngIf="!item.produit.images?.length" class="co-item-placeholder">✿</div>
        </div>
        <div class="co-item-info">
          <span class="co-item-name">{{ item.produit.nom }}</span>
          <span class="co-item-qty">× {{ item.quantite }}</span>
        </div>
        <span class="co-item-price">{{ (item.produit.prix * item.quantite) | number:'1.2-2' }} TND</span>
      </div>
    </div>

    <div class="co-total-row">
      <span>Total</span>
      <span class="co-total-val">{{ total | number:'1.2-2' }} TND</span>
    </div>
  </div>

  <!-- Right: billing form -->
  <div class="co-form-wrap">
    <h2 class="co-form-title">Billing Details</h2>
    <p class="co-form-sub">Review your info and complete your order.</p>

    <!-- ── Countdown Timer ── -->
    <div *ngIf="clientSecret && timeLeft > 0" class="co-timer" [class.co-timer-urgent]="timeLeft <= 20">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <span>Time remaining to pay: <strong>{{ timeLeftFormatted }}</strong></span>
      <div class="co-timer-bar-wrap">
        <div class="co-timer-bar" [style.width]="timerPercent + '%'" [class.urgent]="timeLeft <= 20"></div>
      </div>
    </div>

    <!-- ── Timer expired banner ── -->
    <div *ngIf="timedOut" class="co-alert co-alert-timeout">
      ⏰ Session expired. Redirecting you back to the shop…
    </div>

    <div *ngIf="loadingUser" class="co-spinner-wrap">
      <div class="co-spinner"></div>
      <span>Loading your info…</span>
    </div>

    <form *ngIf="!loadingUser && !timedOut" class="co-form" (ngSubmit)="onSubmit()">

      <div class="co-field">
        <label class="co-label">Email</label>
        <div class="co-input-wrap">
          <span class="co-prefix">✉️</span>
          <input class="co-input" type="email" [(ngModel)]="form.mail" name="mail" readonly />
          <span class="co-lock" title="Auto-filled from your account">🔒</span>
        </div>
      </div>

      <div class="co-row">
        <div class="co-field">
          <label class="co-label">First Name</label>
          <input class="co-input" type="text" [(ngModel)]="form.prenom" name="prenom" readonly />
        </div>
        <div class="co-field">
          <label class="co-label">Last Name</label>
          <input class="co-input" type="text" [(ngModel)]="form.nom" name="nom" readonly />
        </div>
      </div>

      <div class="co-field">
        <label class="co-label">Phone Number <span class="co-required">*</span></label>
        <div class="co-input-wrap">
          <span class="co-prefix">📱</span>
          <input class="co-input" type="tel" [(ngModel)]="form.telephone" name="telephone"
                 placeholder="+216 XX XXX XXX" required
                 [class.error]="submitted && !form.telephone" />
        </div>
        <span *ngIf="submitted && !form.telephone" class="co-err">Phone number is required</span>
      </div>

      <div class="co-field">
        <label class="co-label">City <span class="co-required">*</span></label>
        <div class="co-input-wrap">
          <span class="co-prefix">📍</span>
          <input class="co-input" type="text" [(ngModel)]="form.ville" name="ville"
                 placeholder="e.g. Tunis" required
                 [class.error]="submitted && !form.ville" />
        </div>
        <span *ngIf="submitted && !form.ville" class="co-err">City is required</span>
      </div>

      <div class="co-field" *ngIf="clientSecret">
        <label class="co-label">Card Details <span class="co-required">*</span></label>
        <div id="card-element" class="co-card-element"></div>
        <span *ngIf="stripeError" class="co-err">{{ stripeError }}</span>
      </div>

      <div *ngIf="errorMsg" class="co-alert co-alert-error">{{ errorMsg }}</div>

      <button *ngIf="!clientSecret" class="co-btn-checkout" type="submit" [disabled]="loading">
        <span *ngIf="!loading">
          Continue to Payment
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </span>
        <span *ngIf="loading" class="co-btn-loader">
          <span class="co-dot"></span><span class="co-dot"></span><span class="co-dot"></span>
        </span>
      </button>

      <button *ngIf="clientSecret" class="co-btn-checkout" type="button"
              (click)="onPayNow()" [disabled]="loading || timeLeft === 0">
        <span *ngIf="!loading">Pay Now 💳</span>
        <span *ngIf="loading" class="co-btn-loader">
          <span class="co-dot"></span><span class="co-dot"></span><span class="co-dot"></span>
        </span>
      </button>

      <button class="co-btn-back" type="button" (click)="goBack()">← Back to shop</button>

    </form>
  </div>

</div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@400;500;700&display=swap');

    :host {
      --pk: #ff4f75; --pk-d: #e0365a; --pk-l: #fff0f3;
      --border: #f0dde2; --text: #0f0a0b; --soft: #6b5057; --muted: #9e8087;
      --fd: 'Cormorant Garamond', Georgia, serif;
      --fb: 'DM Sans', system-ui, sans-serif;
    }
    .co-page {
      min-height: 100vh; display: grid;
      grid-template-columns: 1fr 1.2fr; font-family: var(--fb);
    }
    .co-summary {
      background: linear-gradient(160deg,#fff0f3 0%,#ffe4ec 100%);
      padding: 60px 48px; border-right: 1.5px solid var(--border);
      display: flex; flex-direction: column; gap: 24px;
    }
    .co-summary-title {
      font-family: var(--fd); font-size: 1.8rem; color: var(--text);
      display: flex; align-items: center; gap: 10px;
    }
    .co-icon { font-size: 1.6rem; }
    .co-items { display: flex; flex-direction: column; gap: 12px; }
    .co-item {
      display: flex; align-items: center; gap: 14px;
      background: white; border-radius: 14px; padding: 12px 16px;
      border: 1.5px solid var(--border);
      box-shadow: 0 2px 8px rgba(255,79,117,.06);
    }
    .co-item-img {
      width: 56px; height: 56px; border-radius: 10px;
      overflow: hidden; background: var(--pk-l); flex-shrink: 0;
    }
    .co-item-img img { width: 100%; height: 100%; object-fit: cover; }
    .co-item-placeholder {
      width: 100%; height: 100%; display: flex; align-items: center;
      justify-content: center; font-size: 1.6rem; color: var(--pk); opacity: .4;
    }
    .co-item-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .co-item-name { font-weight: 600; font-size: .9rem; color: var(--text); }
    .co-item-qty  { font-size: .78rem; color: var(--muted); }
    .co-item-price {
      font-family: var(--fd); font-size: 1rem;
      color: var(--pk); font-weight: 600; white-space: nowrap;
    }
    .co-total-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 18px 0 0; border-top: 1.5px solid var(--border);
      font-weight: 700; font-size: .95rem; color: var(--soft);
    }
    .co-total-val { font-family: var(--fd); font-size: 1.9rem; color: var(--text); }
    .co-form-wrap {
      background: white; padding: 60px 48px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .co-form-title { font-family: var(--fd); font-size: 2rem; color: var(--text); margin: 0; }
    .co-form-sub   { font-size: .84rem; color: var(--muted); margin: 0 0 24px; }

    /* ── Timer ── */
    .co-timer {
      display: flex; flex-direction: column; gap: 6px;
      background: #fff8e1; border: 1.5px solid #ffe082;
      border-radius: 12px; padding: 12px 16px; margin-bottom: 16px;
      font-size: .84rem; color: #856404; font-weight: 600;
      transition: all .3s;
    }
    .co-timer > div:first-child,
    .co-timer > span { display: flex; align-items: center; gap: 8px; }
    .co-timer-urgent { background: #fff0f0; border-color: #ffb3b3; color: #b91c1c; animation: urgentpulse 1s ease-in-out infinite; }
    @keyframes urgentpulse { 0%,100%{opacity:1} 50%{opacity:.7} }
    .co-timer-bar-wrap { height: 4px; background: rgba(0,0,0,.1); border-radius: 4px; overflow: hidden; margin-top: 2px; }
    .co-timer-bar { height: 100%; background: #f59e0b; border-radius: 4px; transition: width .9s linear, background .3s; }
    .co-timer-bar.urgent { background: #ef4444; }
    .co-alert-timeout {
      background: #fef2f2; border: 1.5px solid #fecaca; color: #dc2626;
      padding: 14px 16px; border-radius: 12px; font-size: .88rem;
      font-weight: 600; text-align: center; animation: fadein .3s ease both;
    }
    @keyframes fadein { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }

    .co-form { display: flex; flex-direction: column; gap: 18px; }
    .co-row  { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .co-field { display: flex; flex-direction: column; gap: 6px; }
    .co-label {
      font-size: .78rem; font-weight: 700; color: var(--soft);
      text-transform: uppercase; letter-spacing: .5px;
    }
    .co-required { color: var(--pk); }
    .co-input-wrap { position: relative; display: flex; align-items: center; }
    .co-prefix { position: absolute; left: 12px; font-size: 1rem; pointer-events: none; z-index: 1; }
    .co-lock { position: absolute; right: 12px; font-size: .8rem; opacity: .5; }
    .co-input {
      width: 100%; padding: 12px 16px 12px 40px;
      border: 1.5px solid var(--border); border-radius: 12px;
      font-size: .9rem; font-family: var(--fb); color: var(--text);
      background: #fff; outline: none; transition: border-color .18s;
      box-sizing: border-box;
    }
    .co-input[readonly] { background: #fafafa; color: var(--soft); cursor: not-allowed; }
    .co-input:not([readonly]):focus { border-color: var(--pk); box-shadow: 0 0 0 3px rgba(255,79,117,.12); }
    .co-input.error { border-color: #ef4444; }
    .co-err { font-size: .72rem; color: #ef4444; margin-top: -4px; }
    .co-card-element { padding: 14px 16px; border: 1.5px solid var(--border); border-radius: 12px; background: #fff; }
    .co-alert { padding: 12px 16px; border-radius: 12px; font-size: .84rem; font-weight: 600; }
    .co-alert-error { background: #fef2f2; border: 1.5px solid #fecaca; color: #dc2626; }
    .co-btn-checkout {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      background: linear-gradient(135deg,var(--pk),var(--pk-d));
      color: white; border: none; padding: 16px; border-radius: 14px;
      font-size: .95rem; font-weight: 700; font-family: var(--fb);
      cursor: pointer; margin-top: 8px;
      box-shadow: 0 6px 20px rgba(255,79,117,.38); transition: all .2s;
    }
    .co-btn-checkout:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(255,79,117,.46); }
    .co-btn-checkout:disabled { opacity: .6; cursor: not-allowed; }
    .co-btn-back {
      background: none; border: none; color: var(--soft);
      font-size: .84rem; font-weight: 600; cursor: pointer;
      font-family: var(--fb); text-align: center; padding: 8px; transition: color .15s;
    }
    .co-btn-back:hover { color: var(--pk); }
    .co-btn-loader { display: flex; gap: 6px; align-items: center; }
    .co-dot {
      width: 8px; height: 8px; border-radius: 50%; background: white;
      animation: dotpulse 1.2s ease-in-out infinite;
    }
    .co-dot:nth-child(2) { animation-delay: .2s; }
    .co-dot:nth-child(3) { animation-delay: .4s; }
    @keyframes dotpulse { 0%,80%,100%{opacity:.25;transform:scale(.8)} 40%{opacity:1;transform:scale(1)} }
    .co-spinner-wrap { display: flex; align-items: center; gap: 12px; color: var(--muted); padding: 24px 0; }
    .co-spinner {
      width: 24px; height: 24px; border-radius: 50%;
      border: 3px solid var(--border); border-top-color: var(--pk);
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 768px) {
      .co-page { grid-template-columns: 1fr; }
      .co-summary, .co-form-wrap { padding: 32px 20px; }
      .co-row { grid-template-columns: 1fr; }
    }
  `],
})
export class Commande implements OnInit, OnDestroy {

  items: CartItem[] = [];
  total = 0;

  form = {
    mail:      '',
    prenom:    '',
    nom:       '',
    telephone: '',
    ville:     '',
    adresse:   '',
  };

  loadingUser  = true;
  loading      = false;
  submitted    = false;
  errorMsg     = '';
  stripeError  = '';

  clientSecret: string | null = null;
  commandeId:   number | null = null;

  // ── Timer state ───────────────────────────────────────────────────────────
  readonly TIMER_SECONDS = 60;
  timeLeft  = this.TIMER_SECONDS;
  timedOut  = false;
  private timerInterval: any = null;

  // ── Stripe ────────────────────────────────────────────────────────────────
  private stripe:      any = null;
  private cardElement: any = null;

  constructor(
    private cartSvc:     CartService,
    private checkoutSvc: CheckoutService,
    private router:      Router,
  ) {}

  ngOnInit(): void {
    this.items = this.cartSvc.items();
    this.total = this.cartSvc.total();

    if (this.items.length === 0) {
      this.router.navigate(['/shop']);
      return;
    }

    this.checkoutSvc.getMyInfo().subscribe({
      next: (res) => {
        const info = res.data;
        this.form.mail   = info.email;
        this.form.prenom = info.firstName;
        this.form.nom    = info.lastName;
        this.loadingUser = false;
      },
      error: () => { this.loadingUser = false; },
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  // ── Timer helpers ─────────────────────────────────────────────────────────

  get timeLeftFormatted(): string {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get timerPercent(): number {
    return (this.timeLeft / this.TIMER_SECONDS) * 100;
  }

  private startTimer(): void {
    this.timeLeft = this.TIMER_SECONDS;
    this.timedOut = false;
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.clearTimer();
        this.onTimeout();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private onTimeout(): void {
    this.timedOut = true;
    // Cancel the pending order on the backend
    if (this.commandeId) {
      this.checkoutSvc.cancelPayment(this.commandeId).subscribe();
    }
    // Redirect after a short delay so the user can read the message
    setTimeout(() => this.router.navigate(['/shop']), 3000);
  }

  // ── Step 1 ────────────────────────────────────────────────────────────────

  onSubmit(): void {
    this.submitted = true;
    this.errorMsg  = '';

    if (!this.form.telephone || !this.form.ville) return;
    if (this.items.length === 0) return;

    this.loading = true;

    const request: CheckoutRequest = {
      nom:       this.form.nom,
      prenom:    this.form.prenom,
      mail:      this.form.mail,
      telephone: this.form.telephone,
      ville:     this.form.ville,
      adresse:   this.form.adresse,
      items: this.items.map(i => ({
        produitId: i.produit.id!,
        quantite:  i.quantite,
      })),
    };

    this.checkoutSvc.createPaymentIntent(request).subscribe({
      next: (res: PaymentIntentResponse) => {
        this.clientSecret = res.clientSecret;
        this.commandeId   = res.commandeId;
        this.loading      = false;
        // Start the 1-minute countdown as soon as the payment form appears
        this.startTimer();
        setTimeout(() => this.mountStripe(), 50);
      },
      error: (err: any) => {
        this.loading  = false;
        this.errorMsg = err?.error?.message || 'Failed to initialize payment. Please try again.';
      },
    });
  }

  // ── Step 2 ────────────────────────────────────────────────────────────────

  async onPayNow(): Promise<void> {
    if (!this.stripe || !this.cardElement || !this.clientSecret) return;
    if (this.timeLeft <= 0) return;

    this.loading     = true;
    this.stripeError = '';

    const result = await this.stripe.confirmCardPayment(this.clientSecret, {
      payment_method: { card: this.cardElement },
    });

    if (result.error) {
      this.stripeError = result.error.message || 'Payment failed.';
      this.loading     = false;
      if (this.commandeId) {
        this.checkoutSvc.cancelPayment(this.commandeId).subscribe();
      }
    } else if (result.paymentIntent?.status === 'succeeded') {
      this.clearTimer(); // Stop the timer on success
      this.checkoutSvc.confirmPayment(
        this.commandeId!,
        result.paymentIntent.id
      ).subscribe({
        next: () => {
          this.cartSvc.clear();
          this.router.navigate(['/mother/shop/order-success']);
        },
        error: () => {
          this.cartSvc.clear();
          this.router.navigate(['/mother/shop/order-success']);
        },
      });
    }
  }

  goBack(): void {
    this.clearTimer();
    if (this.commandeId) {
      this.checkoutSvc.cancelPayment(this.commandeId).subscribe();
    }
    this.router.navigate(['/shop']);
  }

  private mountStripe(): void {
    const stripeKey = 'pk_test_51Q8guRRqOXMp4o1H9ASdJwqCb1XJfHMusXYDWJajdGCte5Ko4MRRX0uXW9J6otwlricAnGz3GUyGXwP6t6UMsBQg001KUJZkH9';
    this.stripe      = Stripe(stripeKey);
    const elements   = this.stripe.elements();
    this.cardElement = elements.create('card', {
      style: {
        base: {
          fontFamily: 'DM Sans, system-ui, sans-serif',
          fontSize:   '15px',
          color:      '#0f0a0b',
          '::placeholder': { color: '#9e8087' },
        },
        invalid: { color: '#ef4444' },
      },
    });
    this.cardElement.mount('#card-element');
  }
}