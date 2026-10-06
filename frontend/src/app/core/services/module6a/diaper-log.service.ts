import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type DiaperType = 'WET' | 'DIRTY' | 'MIXED';

export interface DiaperLogRequestDTO {
  changeTime: string;
  diaperType: DiaperType;
  color?: string;
  consistency?: string;
  notes?: string;
}

export interface DiaperLogResponseDTO {
  id: number;
  babyId: number;
  changeTime: string;
  diaperType: DiaperType;
  color?: string;
  consistency?: string;
  notes?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class DiaperLogService {
  private readonly API_URL = `${environment.apiUrl}/babies`;
  private readonly TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Authorization': `Bearer ${this.TOKEN}`, 'Content-Type': 'application/json' });
  }

  createDiaperLog(babyId: number, request: DiaperLogRequestDTO): Observable<DiaperLogResponseDTO> {
    return this.http.post<DiaperLogResponseDTO>(`${this.API_URL}/${babyId}/diapers`, request, { headers: this.getHeaders() });
  }

  getAllDiaperLogsByBaby(babyId: number): Observable<DiaperLogResponseDTO[]> {
    return this.http.get<DiaperLogResponseDTO[]>(`${this.API_URL}/${babyId}/diapers`, { headers: this.getHeaders() });
  }

  getDiaperLogById(babyId: number, diaperLogId: number): Observable<DiaperLogResponseDTO> {
    return this.http.get<DiaperLogResponseDTO>(`${this.API_URL}/${babyId}/diapers/${diaperLogId}`, { headers: this.getHeaders() });
  }

  updateDiaperLog(babyId: number, diaperLogId: number, request: DiaperLogRequestDTO): Observable<DiaperLogResponseDTO> {
    return this.http.put<DiaperLogResponseDTO>(`${this.API_URL}/${babyId}/diapers/${diaperLogId}`, request, { headers: this.getHeaders() });
  }

  deleteDiaperLog(babyId: number, diaperLogId: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/${babyId}/diapers/${diaperLogId}`, { responseType: 'text', headers: this.getHeaders() });
  }

  getTodayDiaperLogs(babyId: number): Observable<DiaperLogResponseDTO[]> {
    return this.http.get<DiaperLogResponseDTO[]>(`${this.API_URL}/${babyId}/diapers/today`, { headers: this.getHeaders() });
  }
}
