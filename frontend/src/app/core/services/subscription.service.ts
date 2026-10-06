import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SubscriptionRequest,
  SubscriptionResponse,
  InvoiceResponse,
} from '../models/health.models';
import { ApiResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Subscriptions ──────────────────────────────────────────────────────────

  subscribe(
    userId: number,
    payload: SubscriptionRequest
  ): Observable<ApiResponse<SubscriptionResponse>> {
    return this.http.post<ApiResponse<SubscriptionResponse>>(
      `${this.api}/subscriptions?userId=${userId}`,
      payload
    );
  }

  getActiveSubscription(
    userId: number
  ): Observable<ApiResponse<SubscriptionResponse>> {
    return this.http.get<ApiResponse<SubscriptionResponse>>(
      `${this.api}/subscriptions/${userId}`
    );
  }

  changePlan(
    subscriptionId: number,
    payload: SubscriptionRequest
  ): Observable<ApiResponse<SubscriptionResponse>> {
    return this.http.put<ApiResponse<SubscriptionResponse>>(
      `${this.api}/subscriptions/${subscriptionId}`,
      payload
    );
  }

  cancelSubscription(subscriptionId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.api}/subscriptions/${subscriptionId}`
    );
  }

  // ── Invoices ───────────────────────────────────────────────────────────────

  getInvoices(userId: number): Observable<ApiResponse<InvoiceResponse[]>> {
    return this.http.get<ApiResponse<InvoiceResponse[]>>(
      `${this.api}/invoices/${userId}`
    );
  }

  downloadInvoicePdf(invoiceId: number): Observable<Blob> {
    return this.http.get(`${this.api}/invoices/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
  }
}
