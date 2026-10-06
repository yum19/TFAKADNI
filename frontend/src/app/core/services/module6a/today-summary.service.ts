import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TodaySummaryResponseDTO {
  babyId: number;
  date: string; // YYYY-MM-DD
  feedingCount: number;
  totalFeedingQuantity: number;
  sleepCount: number;
  totalSleepMinutes: number;
  diaperCount: number;
  vaccineCountToday: number;
  appointmentCountToday: number;
  reminderCountToday: number;
  unreadInsightCount: number;
  attentionNeeded: boolean;
  summaryTitle: string;
  summaryText: string;
}

@Injectable({
  providedIn: 'root'
})
export class TodaySummaryService {
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
   * Get today's summary for a baby
   */
  getTodaySummary(babyId: number): Observable<TodaySummaryResponseDTO> {
    return this.http.get<TodaySummaryResponseDTO>(
      `${this.API_URL}/${babyId}/summary/today`,
      { headers: this.getHeaders() }
    );
  }
}



