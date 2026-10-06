import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface BabyRhythmProfileDTO {
  id: number;
  babyId: number;
  averageFeedingIntervalMinutes: number | null;
  averageSleepDurationMinutes: number | null;
  usualMorningWakeTime: string | null;
  usualNapTime: string | null;
  usualBedtime: string | null;
  nightWakeFrequency: number | null;
  rhythmStabilityScore: number | null;
  predictedNextFeeding: string | null;
  predictedNextSleep: string | null;
  rhythmLabel: string | null;
  explanation: string | null;
  lastCalculatedAt: string | null;
}

export interface BabyPredictionDTO {
  babyId: number;
  predictionType: 'NEXT_FEEDING' | 'NEXT_SLEEP';
  predictedDateTime: string | null;
  confidenceScore: number;
  explanation: string;
  basedOnDays: number;
}

@Injectable({
  providedIn: 'root'
})
export class RhythmService {
  private readonly API_URL = `${environment.apiUrl}/babies`;
  private readonly TOKEN =
    'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private readonly http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.TOKEN}`,
      'Content-Type': 'application/json'
    });
  }

  recalculateRhythmProfile(babyId: number): Observable<BabyRhythmProfileDTO> {
    return this.http.post<BabyRhythmProfileDTO>(
      `${this.API_URL}/${babyId}/rhythm-profile/recalculate`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getRhythmProfile(babyId: number): Observable<BabyRhythmProfileDTO> {
    return this.http.get<BabyRhythmProfileDTO>(
      `${this.API_URL}/${babyId}/rhythm-profile`,
      { headers: this.getHeaders() }
    );
  }

  predictNextFeeding(babyId: number): Observable<BabyPredictionDTO> {
    return this.http.get<BabyPredictionDTO>(
      `${this.API_URL}/${babyId}/predictions/next-feeding`,
      { headers: this.getHeaders() }
    );
  }

  predictNextSleep(babyId: number): Observable<BabyPredictionDTO> {
    return this.http.get<BabyPredictionDTO>(
      `${this.API_URL}/${babyId}/predictions/next-sleep`,
      { headers: this.getHeaders() }
    );
  }

  getDailyRhythm(babyId: number): Observable<BabyRhythmProfileDTO> {
    return this.http.get<BabyRhythmProfileDTO>(
      `${this.API_URL}/${babyId}/predictions/daily-rhythm`,
      { headers: this.getHeaders() }
    );
  }
}