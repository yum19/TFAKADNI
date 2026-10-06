import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, HealthProfile } from '../models/api.models';
import { unwrap } from './http-helpers';
import { HealthProfileRequest, HealthProfileResponse, SessionResponse } from '../models/health.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

    // ── Health Profile ─────────────────────────────────────────────────────────

  createHealthProfile(
    payload: HealthProfileRequest
  ): Observable<ApiResponse<HealthProfileResponse>> {
    return this.http.post<ApiResponse<HealthProfileResponse>>(
      `${this.baseUrl}/me/health-profile`,
      payload
    );
  }

  getMyHealthProfile(): Observable<ApiResponse<HealthProfileResponse>> {
    return this.http.get<ApiResponse<HealthProfileResponse>>(
      `${this.baseUrl}/me/health-profile`
    );
  }

  updateHealthProfile(
    payload: HealthProfileRequest
  ): Observable<ApiResponse<HealthProfileResponse>> {
    return this.http.put<ApiResponse<HealthProfileResponse>>(
      `${this.baseUrl}/me/health-profile`,
      payload
    );
  }

  getProfileById(id: number): Observable<ApiResponse<HealthProfileResponse>> {
    return this.http.get<ApiResponse<HealthProfileResponse>>(
      `${this.baseUrl}/${id}/profile`
    );
  }

  // ── Sessions ───────────────────────────────────────────────────────────────

  getSessions(userId: number): Observable<ApiResponse<SessionResponse[]>> {
    return this.http.get<ApiResponse<SessionResponse[]>>(
      `${this.baseUrl}/${userId}/sessions`
    );
  }

  revokeSession(userId: number, sessionId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}/${userId}/sessions/${sessionId}`
    );
  }

  // ── Account ────────────────────────────────────────────────────────────────

  deleteMyAccount(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/me`);
  }
}
