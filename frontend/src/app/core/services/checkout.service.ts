// src/app/core/services/checkout.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ── Request DTOs ─────────────────────────────────────────────────────────────

export interface CheckoutItem {
  produitId: number;
  quantite:  number;
}

export interface CheckoutRequest {
  nom:       string;
  prenom:    string;
  mail:      string;
  telephone: string;
  ville:     string;
  adresse:   string;
  items:     CheckoutItem[];
}

// ── Response DTOs ────────────────────────────────────────────────────────────

/** Returned by POST /api/checkout/create-payment-intent */
export interface PaymentIntentResponse {
  clientSecret: string;
  commandeId:   number;
  total:        number;
}

export interface UserInfo {
  email:     string;
  firstName: string;
  lastName:  string;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class CheckoutService {

  private readonly api = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  /** GET /api/users/me/info — pre-fills the checkout form */
  getMyInfo(): Observable<{ data: UserInfo }> {
    return this.http.get<{ data: UserInfo }>(
      `${this.api}/users/me/info`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * POST /api/checkout/create-payment-intent
   * Creates a PENDING commande and returns a Stripe clientSecret.
   */
  createPaymentIntent(request: CheckoutRequest): Observable<PaymentIntentResponse> {
    return this.http.post<PaymentIntentResponse>(
      `${this.api}/checkout/create-payment-intent`,
      request,
      { headers: this.getHeaders() }
    );
  }

  /**
   * POST /api/checkout/confirm/{commandeId}?paymentIntentId=...
   * Called after Stripe.js confirms payment — marks order PAID + sends SMS.
   */
  confirmPayment(commandeId: number, paymentIntentId: string): Observable<void> {
    const params = new HttpParams().set('paymentIntentId', paymentIntentId);
    return this.http.post<void>(
      `${this.api}/checkout/confirm/${commandeId}`,
      {},
      { headers: this.getHeaders(), params }
    );
  }

  /**
   * POST /api/checkout/cancel/{commandeId}
   * Called when Stripe payment is cancelled or fails.
   */
  cancelPayment(commandeId: number): Observable<void> {
    return this.http.post<void>(
      `${this.api}/checkout/cancel/${commandeId}`,
      {},
      { headers: this.getHeaders() }
    );
  }
}