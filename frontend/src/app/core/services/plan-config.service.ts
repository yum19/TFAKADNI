import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';

export interface PlanConfigResponse {
  planKey: string;
  label: string;
  price: string | number;
  icon: string;
  features: string[];
}

export interface PlanConfigRequest {
  label: string;
  price: string | number;
  icon: string;
  features: string[];
}

@Injectable({ providedIn: 'root' })
export class PlanConfigService {
  private readonly api = `${environment.apiUrl}/plans`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<PlanConfigResponse[]>> {
    return this.http.get<ApiResponse<PlanConfigResponse[]>>(this.api);
  }

  update(planKey: string, payload: PlanConfigRequest): Observable<ApiResponse<PlanConfigResponse>> {
    return this.http.put<ApiResponse<PlanConfigResponse>>(`${this.api}/${planKey}`, payload);
  }
}