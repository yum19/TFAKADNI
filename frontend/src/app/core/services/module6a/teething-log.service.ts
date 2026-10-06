import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TeethingLogRequestDTO {
  toothLabel: string;
  eruptionDate: string; // YYYY-MM-DD
  symptoms?: string;
  notes?: string;
}

export interface TeethingLogResponseDTO {
  id: number;
  babyId: number;
  toothLabel: string;
  eruptionDate: string;
  symptoms?: string;
  notes?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeethingLogService {
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
   * Create a new teething log
   */
  createTeethingLog(babyId: number, request: TeethingLogRequestDTO): Observable<TeethingLogResponseDTO> {
    return this.http.post<TeethingLogResponseDTO>(
      `${this.API_URL}/${babyId}/teething`,
      request,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get all teething logs for a baby
   */
  getAllTeethingLogsByBaby(babyId: number): Observable<TeethingLogResponseDTO[]> {
    return this.http.get<TeethingLogResponseDTO[]>(
      `${this.API_URL}/${babyId}/teething`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get a specific teething log
   */
  getTeethingLogById(babyId: number, teethingLogId: number): Observable<TeethingLogResponseDTO> {
    return this.http.get<TeethingLogResponseDTO>(
      `${this.API_URL}/${babyId}/teething/${teethingLogId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Update a teething log
   */
  updateTeethingLog(babyId: number, teethingLogId: number, request: TeethingLogRequestDTO): Observable<TeethingLogResponseDTO> {
    return this.http.put<TeethingLogResponseDTO>(
      `${this.API_URL}/${babyId}/teething/${teethingLogId}`,
      request,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Delete a teething log
   */
  deleteTeethingLog(babyId: number, teethingLogId: number): Observable<string> {
    return this.http.delete(
      `${this.API_URL}/${babyId}/teething/${teethingLogId}`,
      { responseType: 'text', headers: this.getHeaders() }
    );
  }

  /**
   * Get the latest teething log
   */
  getLatestTeethingLog(babyId: number): Observable<TeethingLogResponseDTO> {
    return this.http.get<TeethingLogResponseDTO>(
      `${this.API_URL}/${babyId}/teething/latest`,
      { headers: this.getHeaders() }
    );
  }
}



