import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface MoodLogRequestDto {
  logDate: string; // YYYY-MM-DD
  moodScore: number; // 1-10
  emotionType?: string;
  notes?: string;
  isShared?: boolean;
}

export interface MoodLogResponseDto {
  id: number;
  motherId: number;
  logDate: string;
  moodScore: number;
  emotionType?: string;
  notes?: string;
  isShared: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class MoodLogService {
  private readonly API_URL = `${environment.apiUrl}/postpartum/mood-logs`;
  private readonly TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.TOKEN}`,
    });
  }

  /**
   * Create a new mood log
   */
  createMoodLog(moodLog: MoodLogRequestDto): Observable<MoodLogResponseDto> {
    return this.http.post<MoodLogResponseDto>(this.API_URL, moodLog, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Get all mood logs for the mother
   */
  getMoodLogsByMother(): Observable<MoodLogResponseDto[]> {
    return this.http.get<MoodLogResponseDto[]>(this.API_URL, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Get a specific mood log by ID
   */
  getMoodLogById(id: number): Observable<MoodLogResponseDto> {
    return this.http.get<MoodLogResponseDto>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Update a mood log
   */
  updateMoodLog(id: number, moodLog: MoodLogRequestDto): Observable<MoodLogResponseDto> {
    return this.http.put<MoodLogResponseDto>(`${this.API_URL}/${id}`, moodLog, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Delete a mood log
   */
  deleteMoodLog(id: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/${id}`, {
      responseType: 'text',
      headers: this.getHeaders(),
    });
  }
}
