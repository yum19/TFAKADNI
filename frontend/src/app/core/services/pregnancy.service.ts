import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pregnancy } from '../models/pregnancy.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PregnancyService {
    private url = `${environment.apiUrl}/pregnancies`;

    constructor(private http: HttpClient) {}

    getMyPregnancies(): Observable<Pregnancy[]> {
        return this.http.get<Pregnancy[]>(`${this.url}/me`);
    }

    getActivePregnancy(): Observable<Pregnancy> {
        return this.http.get<Pregnancy>(`${this.url}/me/active`);
    }

    createPregnancy(data: Partial<Pregnancy>): Observable<Pregnancy> {
        return this.http.post<Pregnancy>(`${this.url}`, data);
    }

    updatePregnancy(id: number, data: Partial<Pregnancy>): Observable<Pregnancy> {
        return this.http.put<Pregnancy>(`${this.url}/${id}`, data);
    }

    deletePregnancy(id: number): Observable<void> {
        return this.http.delete<void>(`${this.url}/${id}`);
    }
    getAllPregnanciesAdmin(): Observable<Pregnancy[]> {
    return this.http.get<Pregnancy[]>(`${this.url}/admin/all`);
    }

    updateStatusAdmin(id: number, status: string): Observable<Pregnancy> {
        return this.http.put<Pregnancy>(`${this.url}/admin/${id}/status?status=${status}`, {});
    }

    getActiveForPartner(): Observable<Pregnancy> {
    return this.http.get<Pregnancy>(`${this.url}/partner/active`);
}
}