import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type AppointmentType = 'PEDIATRE' | 'VACCIN' | 'CONTROLE' | 'URGENCE' | 'AUTRE';
export type AppointmentStatus = 'PLANNED' | 'DONE' | 'CANCELLED' | 'MISSED';

export interface BabyAppointmentRequestDTO {
  appointmentDate: string;
  doctorName: string;
  type: AppointmentType;
  location?: string;
  status: AppointmentStatus;
  reminderDate?: string;
  notes?: string;
}

export interface BabyAppointmentResponseDTO {
  id: number;
  babyId: number;
  appointmentDate: string;
  doctorName: string;
  type: AppointmentType;
  location?: string;
  status: AppointmentStatus;
  reminderDate?: string;
  notes?: string;
  upcoming: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
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

  createAppointment(babyId: number, request: BabyAppointmentRequestDTO): Observable<BabyAppointmentResponseDTO> {
    return this.http.post<BabyAppointmentResponseDTO>(`${this.API_URL}/${babyId}/appointments`, request, { headers: this.getHeaders() });
  }

  getAllAppointmentsByBaby(babyId: number): Observable<BabyAppointmentResponseDTO[]> {
    return this.http.get<BabyAppointmentResponseDTO[]>(`${this.API_URL}/${babyId}/appointments`, { headers: this.getHeaders() });
  }

  getAppointmentById(babyId: number, appointmentId: number): Observable<BabyAppointmentResponseDTO> {
    return this.http.get<BabyAppointmentResponseDTO>(`${this.API_URL}/${babyId}/appointments/${appointmentId}`, { headers: this.getHeaders() });
  }

  updateAppointment(babyId: number, appointmentId: number, request: BabyAppointmentRequestDTO): Observable<BabyAppointmentResponseDTO> {
    return this.http.put<BabyAppointmentResponseDTO>(`${this.API_URL}/${babyId}/appointments/${appointmentId}`, request, { headers: this.getHeaders() });
  }

  deleteAppointment(babyId: number, appointmentId: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/${babyId}/appointments/${appointmentId}`, { responseType: 'text', headers: this.getHeaders() });
  }

  getUpcomingAppointments(babyId: number): Observable<BabyAppointmentResponseDTO[]> {
    return this.http.get<BabyAppointmentResponseDTO[]>(`${this.API_URL}/${babyId}/appointments/upcoming`, { headers: this.getHeaders() });
  }

  getAppointmentHistory(babyId: number): Observable<BabyAppointmentResponseDTO[]> {
    return this.http.get<BabyAppointmentResponseDTO[]>(`${this.API_URL}/${babyId}/appointments/history`, { headers: this.getHeaders() });
  }
}
