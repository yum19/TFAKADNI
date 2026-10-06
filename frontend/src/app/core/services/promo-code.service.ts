import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ValidatePromoRequest, PromoCodeResponse } from '../models/health.models';
import { ApiResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class PromoCodeService {
  private readonly api = `${environment.apiUrl}/promo-codes`;

  constructor(private http: HttpClient) {}

  /**
   * POST /api/promo-codes/validate
   * Vérifier un code promo (utilisatrice)
   */
  validateCode(payload: ValidatePromoRequest): Observable<ApiResponse<PromoCodeResponse>> {
    return this.http.post<ApiResponse<PromoCodeResponse>>(`${this.api}/validate`, payload);
  }
}