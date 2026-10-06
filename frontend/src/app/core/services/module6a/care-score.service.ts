import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CareScoreResponseDTO {
  babyId: number;
  score: number;
  level: string;
  explanation: string;
  feedingFollowed: boolean;
  sleepFollowed: boolean;
  diaperFollowed: boolean;
  growthUpToDate: boolean;
  vaccineFollowed: boolean;
  remindersUnderControl: boolean;
  feedingPoints: number;
  sleepPoints: number;
  diaperPoints: number;
  growthPoints: number;
  vaccinePoints: number;
  reminderPoints: number;
}

@Injectable({ providedIn: 'root' })
export class CareScoreService {
  private readonly API_URL = `${environment.apiUrl}/babies`;
  // Token pour les tests - A remplacer par un token dynamique une fois le login implemente
  private readonly TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.TOKEN}`,
      'Content-Type': 'application/json'
    });
  }

  getCareScore(babyId: number): Observable<CareScoreResponseDTO> {
    return this.http.get<CareScoreResponseDTO>(`${this.API_URL}/${babyId}/care-score`, { headers: this.getHeaders() });
  }
}
