import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Vitals } from '../models/pregnancy.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VitalsService {
    private url = `${environment.apiUrl}/vitals`;

    constructor(private http: HttpClient) {}

    getMyVitals(): Observable<Vitals[]> {
        return this.http.get<Vitals[]>(`${this.url}/me`);
    }

    getLatestVital(): Observable<Vitals> {
        return this.http.get<Vitals[]>(`${this.url}/me`).pipe(
            map(vitals => vitals[vitals.length - 1])
        );
    }

    saveVital(data: Partial<Vitals>, pregnancyId: number): Observable<Vitals> {
        return this.http.post<Vitals>(`${this.url}?pregnancyId=${pregnancyId}`, data);
    }

    updateVital(id: number, data: Partial<Vitals>): Observable<Vitals> {
        return this.http.put<Vitals>(`${this.url}/${id}`, data);
    }

    deleteVital(id: number): Observable<void> {
        return this.http.delete<void>(`${this.url}/${id}`);
    }
    getAllVitalsAdmin(): Observable<Vitals[]> {
    return this.http.get<Vitals[]>(`${this.url}/admin/all`);
}
}