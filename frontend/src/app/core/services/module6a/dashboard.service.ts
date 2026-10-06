import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface BabyDashboardDTO {
  babyId: number;
  babyFirstName: string;
  babyLastName: string;
  birthDate: string;
  gender: string;
  latestFeedingDate?: string;
  latestFeedingTime?: string;
  latestFeedingMode?: string;
  latestFeedingQuantity?: number;
  latestFeedingDuration?: number;
  latestSleepStart?: string;
  latestSleepEnd?: string;
  latestSleepDuration?: number;
  latestSleepQuality?: string;
  latestDiaperChangeTime?: string;
  latestDiaperType?: string;
  latestToothLabel?: string;
  latestToothDate?: string;
  latestGrowthDate?: string;
  latestWeight?: number;
  latestHeight?: number;
  latestHeadCircumference?: number;
  latestBmi?: number;
  upcomingVaccineName?: string;
  upcomingVaccineDate?: string;
  upcomingAppointmentType?: string;
  upcomingAppointmentDate?: string;
  upcomingDoctorName?: string;
  latestMilestoneTitle?: string;
  latestMilestoneDate?: string;
  latestMilestoneCategory?: string;
  latestDocumentTitle?: string;
  latestDocumentType?: string;
  latestDocumentUploadedAt?: string;
  pendingRemindersCount: number;
  unreadInsightsCount: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
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

  getDashboard(babyId: number): Observable<BabyDashboardDTO> {
    return this.http.get<BabyDashboardDTO>(`${this.API_URL}/${babyId}/dashboard`, { headers: this.getHeaders() });
  }
}
