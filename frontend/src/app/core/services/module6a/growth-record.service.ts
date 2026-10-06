import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface GrowthRecordRequestDTO {
  recordDate: string;
  weight: number;
  height: number;
  headCircumference?: number;
  notes?: string;
}

export interface GrowthRecordResponseDTO {
  id: number;
  babyId: number;
  recordDate: string;
  weight: number;
  height: number;
  headCircumference?: number;
  bmi: number;
  notes?: string;
  createdAt: string;
}

export interface GrowthAnalysis {
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class GrowthRecordService {
  private readonly API_URL = `${environment.apiUrl}/babies`;
  private readonly TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Authorization': `Bearer ${this.TOKEN}`, 'Content-Type': 'application/json' });
  }

  createGrowthRecord(babyId: number, request: GrowthRecordRequestDTO): Observable<GrowthRecordResponseDTO> {
    return this.http.post<GrowthRecordResponseDTO>(`${this.API_URL}/${babyId}/growth-records`, request, { headers: this.getHeaders() });
  }

  getAllGrowthRecords(babyId: number): Observable<GrowthRecordResponseDTO[]> {
    return this.http.get<GrowthRecordResponseDTO[]>(`${this.API_URL}/${babyId}/growth-records`, { headers: this.getHeaders() });
  }

  getGrowthRecordById(babyId: number, recordId: number): Observable<GrowthRecordResponseDTO> {
    return this.http.get<GrowthRecordResponseDTO>(`${this.API_URL}/${babyId}/growth-records/${recordId}`, { headers: this.getHeaders() });
  }

  updateGrowthRecord(babyId: number, recordId: number, request: GrowthRecordRequestDTO): Observable<GrowthRecordResponseDTO> {
    return this.http.put<GrowthRecordResponseDTO>(`${this.API_URL}/${babyId}/growth-records/${recordId}`, request, { headers: this.getHeaders() });
  }

  deleteGrowthRecord(babyId: number, recordId: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/${babyId}/growth-records/${recordId}`, { responseType: 'text', headers: this.getHeaders() });
  }

  getLatestGrowthRecord(babyId: number): Observable<GrowthRecordResponseDTO> {
    return this.http.get<GrowthRecordResponseDTO>(`${this.API_URL}/${babyId}/growth-records/latest`, { headers: this.getHeaders() });
  }

  getGrowthChart(babyId: number): Observable<GrowthRecordResponseDTO[]> {
    return this.http.get<GrowthRecordResponseDTO[]>(`${this.API_URL}/${babyId}/growth-records/chart`, { headers: this.getHeaders() });
  }

  getGrowthAnalysis(babyId: number): Observable<GrowthAnalysis> {
    return this.http.get<GrowthAnalysis>(`${this.API_URL}/${babyId}/growth-records/analysis`, { headers: this.getHeaders() });
  }
}
