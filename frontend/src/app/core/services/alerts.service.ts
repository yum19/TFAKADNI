import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alert } from '../models/pregnancy.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AlertsService {
    private url = `${environment.apiUrl}/alerts`;

    constructor(private http: HttpClient) {}

    getMyAlerts(): Observable<Alert[]> {
        return this.http.get<Alert[]>(`${this.url}/me`);
    }

    getUnreadAlerts(): Observable<Alert[]> {
        return this.http.get<Alert[]>(`${this.url}/me/unread`);
    }

    markAsRead(id: number): Observable<Alert> {
        return this.http.put<Alert>(`${this.url}/${id}/read`, {});
    }

    dismiss(id: number): Observable<Alert> {
        return this.http.put<Alert>(`${this.url}/${id}/dismiss`, {});
    }

    markAllAsRead(): Observable<void> {
        return this.http.put<void>(`${this.url}/me/read-all`, {});
    }
    getAllAlertsAdmin(): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.url}/admin/all`);
}
}