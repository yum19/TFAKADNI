import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ScreeningAssessmentRequestDto {
  age: string;
  feelingSadOrTearful: string;
  irritableTowardsBabyPartner: string;
  troubleSleepingAtNight: string;
  problemsConcentratingOrMakingDecision: string;
  overeatingOrLossOfAppetite: string;
  feelingAnxious: string;
  feelingOfGuilt: string;
  problemsOfBondingWithBaby: string;
  suicideAttempt: string;
  sharedWithDoctor: boolean;
}

export interface ScreeningAssessmentResponseDto {
  id: number;
  motherId: number;
  assessmentDate: string;
  age: string;
  feelingSadOrTearful: string;
  irritableTowardsBabyPartner: string;
  troubleSleepingAtNight: string;
  problemsConcentratingOrMakingDecision: string;
  overeatingOrLossOfAppetite: string;
  feelingAnxious: string;
  feelingOfGuilt: string;
  problemsOfBondingWithBaby: string;
  suicideAttempt: string;
  sharedWithDoctor: boolean;
  createdAt: string;
}

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
export class ScreeningAssessmentService {
  private readonly API_URL = `${environment.apiUrl}/postpartum/screenings`;

  private readonly TOKEN =
    'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.TOKEN}`,
    });
  }

  createAssessment(
    assessment: ScreeningAssessmentRequestDto
  ): Observable<PredictionResultResponseDto> {
    return this.http.post<PredictionResultResponseDto>(this.API_URL, assessment, {
      headers: this.getHeaders(),
    });
  }

  getAssessmentsByMother(): Observable<ScreeningAssessmentResponseDto[]> {
    return this.http.get<ScreeningAssessmentResponseDto[]>(this.API_URL, {
      headers: this.getHeaders(),
    });
  }

  getAssessmentById(id: number): Observable<ScreeningAssessmentResponseDto> {
    return this.http.get<ScreeningAssessmentResponseDto>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  getLatestAssessment(): Observable<ScreeningAssessmentResponseDto> {
    return this.http.get<ScreeningAssessmentResponseDto>(`${this.API_URL}/latest`, {
      headers: this.getHeaders(),
    });
  }

  deleteAssessment(id: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
      responseType: 'text',
    });
  }
}