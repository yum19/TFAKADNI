import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FollowUpAnalyticsResponse } from './follow-up-analytics.model';

@Injectable({
  providedIn: 'root'
})
export class FollowUpAnalyticsService {
  private http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:8081/api/admin/postpartum/analytics/screening-appointments/overview';

  private readonly token =
    'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJBRE1JTiIsInR5cGUiOiJBQ0NFU1MiLCJpYXQiOjE3NzY2MjAyMDEsImV4cCI6MTc3NzIyNTAwMX0.3dUfOySb42r_3vlSRu9gK16aobLKA2VuzEKKa_4_JZykgWohIoqLo-1Bmm1yhhYqFenQn8Sdh6gvpoBHniaR1g';

  getAnalytics(): Observable<FollowUpAnalyticsResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.token}`
    });

    return this.http.get<FollowUpAnalyticsResponse>(this.apiUrl, { headers });
  }
}