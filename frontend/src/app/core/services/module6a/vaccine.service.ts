import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type VaccineStatus = 'SCHEDULED' | 'DONE' | 'MISSED' | 'CANCELLED';

export interface VaccineRequestDTO {
  vaccineName: string;
  scheduledDate: string; // YYYY-MM-DD
  takenDate?: string; // YYYY-MM-DD
  status: VaccineStatus;
  reminderDate?: string; // YYYY-MM-DD
  batchNumber?: string;
  administeredBy?: string;
  notes?: string;
}

export interface VaccineResponseDTO {
  id: number;
  babyId: number;
  vaccineName: string;
  scheduledDate: string;
  takenDate?: string;
  status: VaccineStatus;
  reminderDate?: string;
  batchNumber?: string;
  administeredBy?: string;
  notes?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class VaccineService {
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
   * Create a new vaccine record
   */
  createVaccine(babyId: number, request: VaccineRequestDTO): Observable<VaccineResponseDTO> {
    return this.http.post<VaccineResponseDTO>(
      `${this.API_URL}/${babyId}/vaccines`,
      request,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get all vaccine records for a baby
   */
  getAllVaccinesByBaby(babyId: number): Observable<VaccineResponseDTO[]> {
    return this.http.get<VaccineResponseDTO[]>(
      `${this.API_URL}/${babyId}/vaccines`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get a specific vaccine record
   */
  getVaccineById(babyId: number, vaccineId: number): Observable<VaccineResponseDTO> {
    return this.http.get<VaccineResponseDTO>(
      `${this.API_URL}/${babyId}/vaccines/${vaccineId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Update a vaccine record
   */
  updateVaccine(babyId: number, vaccineId: number, request: VaccineRequestDTO): Observable<VaccineResponseDTO> {
    return this.http.put<VaccineResponseDTO>(
      `${this.API_URL}/${babyId}/vaccines/${vaccineId}`,
      request,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Delete a vaccine record
   */
  deleteVaccine(babyId: number, vaccineId: number): Observable<string> {
    return this.http.delete(
      `${this.API_URL}/${babyId}/vaccines/${vaccineId}`,
      { responseType: 'text', headers: this.getHeaders() }
    );
  }

  /**
   * Get upcoming vaccines for a baby
   */
  getUpcomingVaccines(babyId: number): Observable<VaccineResponseDTO[]> {
    return this.http.get<VaccineResponseDTO[]>(
      `${this.API_URL}/${babyId}/vaccines/upcoming`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get overdue vaccines for a baby
   */
  getOverdueVaccines(babyId: number): Observable<VaccineResponseDTO[]> {
    return this.http.get<VaccineResponseDTO[]>(
      `${this.API_URL}/${babyId}/vaccines/overdue`,
      { headers: this.getHeaders() }
    );
  }
}



