import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PredictionResultResponseDto {
  id: number;
  screeningId: number;
  riskLabel: number;
  riskLevel: string;
  confidence: number;
  probabilityLow: number;
  probabilityModerate: number;
  probabilityHigh: number;
  predictionDate: string;
  modelVersion: string;
}

@Injectable({
  providedIn: 'root'
})
export class PredictionResultService {
  private readonly API_URL = `${environment.apiUrl}/postpartum/screenings`;
  private readonly TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.TOKEN}`
    });
  }

  getPredictionsByMother(): Observable<PredictionResultResponseDto[]> {
    return this.http.get<PredictionResultResponseDto[]>(
      `${this.API_URL}/predictions`,
      { headers: this.getHeaders() }
    );
  }

  getPredictionById(id: number): Observable<PredictionResultResponseDto> {
    return this.http.get<PredictionResultResponseDto>(
      `${this.API_URL}/predictions/${id}`,
      { headers: this.getHeaders() }
    );
  }

  getLatestPredictionByMother(): Observable<PredictionResultResponseDto> {
    return this.http.get<PredictionResultResponseDto>(
      `${this.API_URL}/predictions/latest`,
      { headers: this.getHeaders() }
    );
  }
  
}