import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type InsightType = 'INFO' | 'ATTENTION' | 'TREND' | 'REMINDER' | 'RECOMMENDATION';
export type InsightPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type InsightStatus = 'ACTIVE' | 'DISMISSED' | 'RESOLVED';
export type SourceModule = 'SLEEP' | 'GROWTH' | 'FEEDING' | 'DIAPER' | 'TEETHING' | 'MILESTONE';

export interface BabyInsightResponseDTO {
  id: number;
  babyId: number;
  insightType: InsightType;
  title: string;
  message: string;
  priority: InsightPriority;
  sourceModule: SourceModule;
  generatedAt: string;
  isRead: boolean;
  status: InsightStatus;
  actionLabel?: string;
  actionUrl?: string;
  confidenceScore?: number;
  generatedBy?: string;

  ruleCode?: string;
  reason?: string;
  evidenceSummary?: string;
  readAt?: string;
  dismissedAt?: string;
  resolvedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InsightService {
  private readonly API_URL = `${environment.apiUrl}/babies`;

  // Token de test conservé comme demandé
  private readonly TOKEN =
    'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.TOKEN}`,
      'Content-Type': 'application/json'
    });
  }

  getAllInsights(babyId: number): Observable<BabyInsightResponseDTO[]> {
    return this.http.get<BabyInsightResponseDTO[]>(
      `${this.API_URL}/${babyId}/insights`,
      { headers: this.getHeaders() }
    );
  }

  getUnreadInsights(babyId: number): Observable<BabyInsightResponseDTO[]> {
    return this.http.get<BabyInsightResponseDTO[]>(
      `${this.API_URL}/${babyId}/insights/unread`,
      { headers: this.getHeaders() }
    );
  }

  generateInsights(babyId: number): Observable<BabyInsightResponseDTO[]> {
    return this.http.post<BabyInsightResponseDTO[]>(
      `${this.API_URL}/${babyId}/insights/generate`,
      {},
      { headers: this.getHeaders() }
    );
  }

  markAsRead(babyId: number, insightId: number): Observable<BabyInsightResponseDTO> {
    return this.http.put<BabyInsightResponseDTO>(
      `${this.API_URL}/${babyId}/insights/${insightId}/read`,
      {},
      { headers: this.getHeaders() }
    );
  }

  dismissInsight(babyId: number, insightId: number): Observable<BabyInsightResponseDTO> {
    return this.http.put<BabyInsightResponseDTO>(
      `${this.API_URL}/${babyId}/insights/${insightId}/dismiss`,
      {},
      { headers: this.getHeaders() }
    );
  }

  resolveInsight(babyId: number, insightId: number): Observable<BabyInsightResponseDTO> {
    return this.http.put<BabyInsightResponseDTO>(
      `${this.API_URL}/${babyId}/insights/${insightId}/resolve`,
      {},
      { headers: this.getHeaders() }
    );
  }

  markAllAsRead(babyId: number): Observable<void> {
    return this.http.put<void>(
      `${this.API_URL}/${babyId}/insights/read-all`,
      {},
      { headers: this.getHeaders() }
    );
  }
}