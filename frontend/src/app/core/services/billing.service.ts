import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Invoice, Subscription } from '../models/api.models';
import { unwrap } from './http-helpers';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  getSubscription(): Observable<Subscription> {
    return unwrap(this.http.get<ApiResponse<Subscription>>(`${this.api}/subscriptions/me`));
  }

  subscribe(plan: 'FREE' | 'PREMIUM' | 'PRO', promoCode?: string): Observable<Subscription> {
    return unwrap(this.http.post<ApiResponse<Subscription>>(`${this.api}/subscriptions`, { plan, promoCode }));
  }

  changePlan(id: number, plan: 'FREE' | 'PREMIUM' | 'PRO', promoCode?: string): Observable<Subscription> {
    return unwrap(this.http.put<ApiResponse<Subscription>>(`${this.api}/subscriptions/${id}`, { plan, promoCode }));
  }

  cancel(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/subscriptions/${id}`);
  }

  getInvoices(): Observable<Invoice[]> {
    return unwrap(this.http.get<ApiResponse<Invoice[]>>(`${this.api}/invoices/me`));
  }

  downloadInvoicePdf(id: number): Observable<Blob> {
    return this.http.get(`${this.api}/invoices/${id}/pdf`, { responseType: 'blob' });
  }
}
