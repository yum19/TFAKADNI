import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AlertRule } from '../models/pregnancy.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AlertRuleService {
    private url = `${environment.apiUrl}/alert-rules`;

    constructor(private http: HttpClient) {}

    getMyRules(): Observable<AlertRule[]> {
        return this.http.get<AlertRule[]>(`${this.url}/me`);
    }

    getAllAdmin(): Observable<AlertRule[]> {
        return this.http.get<AlertRule[]>(`${this.url}/admin/all`);
    }

    createRule(data: Partial<AlertRule>): Observable<AlertRule> {
        return this.http.post<AlertRule>(`${this.url}`, data);
    }

    updateRule(id: number, data: Partial<AlertRule>): Observable<AlertRule> {
        return this.http.put<AlertRule>(`${this.url}/${id}`, data);
    }

    toggleRule(id: number): Observable<AlertRule> {
        return this.http.put<AlertRule>(`${this.url}/${id}/toggle`, {});
    }

    deleteRule(id: number): Observable<void> {
        return this.http.delete<void>(`${this.url}/${id}`);
    }
}