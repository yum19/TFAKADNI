import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type SleepQuality = 'GOOD' | 'RESTLESS' | 'INTERRUPTED';

export interface SleepLogRequestDTO {
  sleepStart: string; // ISO DateTime
  sleepEnd: string; // ISO DateTime
  quality: SleepQuality;
  notes?: string;
}

export interface SleepLogResponseDTO {
  id: number;
  babyId: number;
  sleepStart: string;
  sleepEnd: string;
  duration: number; // in minutes
  quality: SleepQuality;
  notes?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class SleepLogService {
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
   * Create a new sleep log
   */
  createSleepLog(babyId: number, request: SleepLogRequestDTO): Observable<SleepLogResponseDTO> {
    return this.http.post<SleepLogResponseDTO>(
      `${this.API_URL}/${babyId}/sleep-logs`,
      request,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get all sleep logs for a baby
   */
  getAllSleepLogsByBaby(babyId: number): Observable<SleepLogResponseDTO[]> {
    return this.http.get<SleepLogResponseDTO[]>(
      `${this.API_URL}/${babyId}/sleep-logs`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get a specific sleep log
   */
  getSleepLogById(babyId: number, sleepLogId: number): Observable<SleepLogResponseDTO> {
    return this.http.get<SleepLogResponseDTO>(
      `${this.API_URL}/${babyId}/sleep-logs/${sleepLogId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Update a sleep log
   */
  updateSleepLog(babyId: number, sleepLogId: number, request: SleepLogRequestDTO): Observable<SleepLogResponseDTO> {
    return this.http.put<SleepLogResponseDTO>(
      `${this.API_URL}/${babyId}/sleep-logs/${sleepLogId}`,
      request,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Delete a sleep log
   */
  deleteSleepLog(babyId: number, sleepLogId: number): Observable<string> {
    return this.http.delete(
      `${this.API_URL}/${babyId}/sleep-logs/${sleepLogId}`,
      { responseType: 'text', headers: this.getHeaders() }
    );
  }
}



