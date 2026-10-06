import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type FeedingMode = 'breastfeeding' | 'bottle' | 'pumped' | 'mixed';
export type FeedingSide = 'LEFT' | 'RIGHT' | 'BOTH' | 'NONE';

export interface FeedingRequestDTO {
  feedingDate: string;
  feedingTime: string;
  feedingMode: FeedingMode;
  quantity?: number;
  duration?: number;
  sideUsed?: FeedingSide;
  notes?: string;
}

export interface FeedingResponseDTO {
  id: number;
  babyId: number;
  feedingDate: string;
  feedingTime: string;
  feedingMode: FeedingMode;
  quantity?: number;
  duration?: number;
  sideUsed?: FeedingSide;
  notes?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class FeedingService {
  private readonly API_URL = `${environment.apiUrl}/babies`;
  private readonly TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Authorization': `Bearer ${this.TOKEN}`, 'Content-Type': 'application/json' });
  }

  createFeeding(babyId: number, request: FeedingRequestDTO): Observable<FeedingResponseDTO> {
    return this.http.post<FeedingResponseDTO>(`${this.API_URL}/${babyId}/feedings`, request, { headers: this.getHeaders() });
  }

  getAllFeedingsByBaby(babyId: number): Observable<FeedingResponseDTO[]> {
    return this.http.get<FeedingResponseDTO[]>(`${this.API_URL}/${babyId}/feedings`, { headers: this.getHeaders() });
  }

  getFeedingById(babyId: number, feedingId: number): Observable<FeedingResponseDTO> {
    return this.http.get<FeedingResponseDTO>(`${this.API_URL}/${babyId}/feedings/${feedingId}`, { headers: this.getHeaders() });
  }

  updateFeeding(babyId: number, feedingId: number, request: FeedingRequestDTO): Observable<FeedingResponseDTO> {
    return this.http.put<FeedingResponseDTO>(`${this.API_URL}/${babyId}/feedings/${feedingId}`, request, { headers: this.getHeaders() });
  }

  deleteFeeding(babyId: number, feedingId: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/${babyId}/feedings/${feedingId}`, { responseType: 'text', headers: this.getHeaders() });
  }
}
