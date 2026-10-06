import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';

export interface CheckoutRequest {
  plan: string;
  promoCode?: string;
}

export interface CheckoutResponse {
  paymentUrl?: string;
  paymentRef?: string;
  originalAmount: number;
  discountAmount?: number;
  finalAmount: number;
  discountPercent?: number;
  plan: string;
  promoCode?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly api = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  checkout(payload: CheckoutRequest): Observable<ApiResponse<CheckoutResponse>> {
    return this.http.post<ApiResponse<CheckoutResponse>>(`${this.api}/checkout`, payload);
  }

  confirm(ref: string, plan: string, promoCode?: string): Observable<ApiResponse<CheckoutResponse>> {
    let url = `${this.api}/confirm?ref=${ref}&plan=${plan}`;
    if (promoCode) url += `&promoCode=${promoCode}`;
    return this.http.get<ApiResponse<CheckoutResponse>>(url);
  }
}