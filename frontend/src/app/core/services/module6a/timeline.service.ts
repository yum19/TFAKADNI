import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TimelineEventResponseDTO {
  eventType: string;
  sourceId: number;
  eventDateTime: string; // ISO DateTime
  title: string;
  description: string;
  priority: string; // NORMAL, IMPORTANT, UNUSUAL, TREND_LINKED
  status: string;
  actionUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TimelineService {
  private readonly API_URL = `${environment.apiUrl}/babies`;
  private readonly TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.TOKEN}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get timeline events for a baby (all time or filtered by days)
   */
  getTimeline(babyId: number, days?: number): Observable<TimelineEventResponseDTO[]> {
    let params = new HttpParams();
    if (days !== undefined) {
      params = params.set('days', days.toString());
    }
    return this.http.get<TimelineEventResponseDTO[]>(
      `${this.API_URL}/${babyId}/timeline`,
      { params, headers: this.getHeaders() }
    );
  }
}



