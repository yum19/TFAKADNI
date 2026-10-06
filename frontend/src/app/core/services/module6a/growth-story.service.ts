import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface GrowthStoryResponseDTO {
  babyId: number;
  level: string;
  latestRecordDate: string;
  latestWeight: number;
  latestHeight: number;
  latestHeadCircumference: number;
  latestBmi: number;
  weightDifference: number;
  heightDifference: number;
  headCircumferenceDifference: number;
  bmiDifference: number;
  title: string;
  story: string;
  recommendation: string;
}

@Injectable({ providedIn: 'root' })
export class GrowthStoryService {
  private readonly API_URL = `${environment.apiUrl}/babies`;
  private readonly TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.TOKEN}`,
      'Content-Type': 'application/json'
    });
  }

  getGrowthStory(babyId: number): Observable<GrowthStoryResponseDTO> {
    return this.http.get<GrowthStoryResponseDTO>(`${this.API_URL}/${babyId}/growth-story`, { headers: this.getHeaders() });
  }
}
