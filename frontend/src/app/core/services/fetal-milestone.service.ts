import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FetalMilestone } from '../models/pregnancy.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FetalMilestoneService {
    private url = `${environment.apiUrl}/fetal`;

    constructor(private http: HttpClient) {}

    getByWeek(week: number): Observable<FetalMilestone> {
        return this.http.get<FetalMilestone>(`${this.url}/week/${week}`);
    }

    getByTrimester(trimester: string): Observable<FetalMilestone[]> {
        return this.http.get<FetalMilestone[]>(`${this.url}/trimester/${trimester}`);
    }

    getAll(): Observable<FetalMilestone[]> {
        return this.http.get<FetalMilestone[]>(`${this.url}/all`);
    }

    // ===== ADMIN =====
    getAllAdmin(): Observable<FetalMilestone[]> {
        return this.http.get<FetalMilestone[]>(`${this.url}/admin/all`);
    }

    createMilestone(data: Partial<FetalMilestone>): Observable<FetalMilestone> {
        return this.http.post<FetalMilestone>(`${this.url}/admin`, data);
    }

    updateMilestone(id: number, data: Partial<FetalMilestone>): Observable<FetalMilestone> {
        return this.http.put<FetalMilestone>(`${this.url}/admin/${id}`, data);
    }

    deleteMilestone(id: number): Observable<void> {
        return this.http.delete<void>(`${this.url}/admin/${id}`);
    }
}