import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PsychAppointmentRequestDto {
  predictionResultId?: number;
  psychologistName?: string;
  appointmentDate: string;
  type?: string;
  status?: string;
  location?: string;
  notes?: string;
}

export interface PsychAppointmentResponseDto {
  id: number;
  motherId: number;
  predictionResultId?: number;
  psychologistName?: string;
  appointmentDate: string;
  type?: string;
  status: string;
  location?: string;
  notes?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class PsychAppointmentService {
  private readonly API_URL = `${environment.apiUrl}/postpartum/psych-appointments`;

  private readonly TOKEN =
    'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.TOKEN}`,
    });
  }

  createAppointment(appointment: PsychAppointmentRequestDto): Observable<PsychAppointmentResponseDto> {
    return this.http.post<PsychAppointmentResponseDto>(this.API_URL, appointment, {
      headers: this.getHeaders(),
    });
  }

  getAppointmentsByMother(status?: string): Observable<PsychAppointmentResponseDto[]> {
    let params = new HttpParams();

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<PsychAppointmentResponseDto[]>(
      this.API_URL,
      { params, headers: this.getHeaders() }
    );
  }

  getAppointmentById(id: number): Observable<PsychAppointmentResponseDto> {
    return this.http.get<PsychAppointmentResponseDto>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  updateAppointment(id: number, appointment: PsychAppointmentRequestDto): Observable<PsychAppointmentResponseDto> {
    return this.http.put<PsychAppointmentResponseDto>(`${this.API_URL}/${id}`, appointment, {
      headers: this.getHeaders(),
    });
  }

  deleteAppointment(id: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/${id}`, {
      responseType: 'text',
      headers: this.getHeaders(),
    });
  }
}