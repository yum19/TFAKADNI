import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type ReminderType = 'VACCINE' | 'APPOINTMENT' | 'GROWTH' | 'CUSTOM';
export type ReminderStatus = 'PENDING' | 'SENT' | 'DISMISSED';

export interface ReminderRequestDTO {
  type: ReminderType;
  reminderDate: string;
  message: string;
  status?: ReminderStatus;
}

export interface ReminderResponseDTO {
  id: number;
  babyId: number;
  type: ReminderType;
  reminderDate: string;
  message: string;
  status: ReminderStatus;
  sourceType?: string;
  sourceId?: number;
  createdAt: string;
  overdue?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  private readonly API_URL = `${environment.apiUrl}/babies`;
  private readonly TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.TOKEN}`,
      'Content-Type': 'application/json'
    });
  }

  createReminder(babyId: number, request: ReminderRequestDTO): Observable<ReminderResponseDTO> {
    return this.http.post<ReminderResponseDTO>(
      `${this.API_URL}/${babyId}/reminders`,
      request,
      { headers: this.getHeaders() }
    );
  }

  getAllRemindersByBaby(babyId: number): Observable<ReminderResponseDTO[]> {
    return this.http.get<ReminderResponseDTO[]>(
      `${this.API_URL}/${babyId}/reminders`,
      { headers: this.getHeaders() }
    );
  }

  getReminderById(babyId: number, reminderId: number): Observable<ReminderResponseDTO> {
    return this.http.get<ReminderResponseDTO>(
      `${this.API_URL}/${babyId}/reminders/${reminderId}`,
      { headers: this.getHeaders() }
    );
  }

  updateReminder(
    babyId: number,
    reminderId: number,
    request: ReminderRequestDTO
  ): Observable<ReminderResponseDTO> {
    return this.http.put<ReminderResponseDTO>(
      `${this.API_URL}/${babyId}/reminders/${reminderId}`,
      request,
      { headers: this.getHeaders() }
    );
  }

  updateReminderStatus(
    babyId: number,
    reminderId: number,
    status: ReminderStatus
  ): Observable<ReminderResponseDTO> {
    return this.http.patch<ReminderResponseDTO>(
      `${this.API_URL}/${babyId}/reminders/${reminderId}/status`,
      { status },
      { headers: this.getHeaders() }
    );
  }

  deleteReminder(babyId: number, reminderId: number): Observable<string> {
    return this.http.delete(
      `${this.API_URL}/${babyId}/reminders/${reminderId}`,
      { responseType: 'text', headers: this.getHeaders() }
    );
  }

  getPendingReminders(babyId: number): Observable<ReminderResponseDTO[]> {
    return this.http.get<ReminderResponseDTO[]>(
      `${this.API_URL}/${babyId}/reminders/pending`,
      { headers: this.getHeaders() }
    );
  }

  getTodayReminders(babyId: number): Observable<ReminderResponseDTO[]> {
    return this.http.get<ReminderResponseDTO[]>(
      `${this.API_URL}/${babyId}/reminders/today`,
      { headers: this.getHeaders() }
    );
  }
}