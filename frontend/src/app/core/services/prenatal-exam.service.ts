import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PrenatalExam } from '../models/pregnancy.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PrenatalExamService {
    private url = `${environment.apiUrl}/exams`;

    constructor(private http: HttpClient) {}

    getExamsByPregnancy(pregnancyId: number): Observable<PrenatalExam[]> {
        return this.http.get<PrenatalExam[]>(`${this.url}/pregnancy/${pregnancyId}`);
    }

    getPendingExams(pregnancyId: number): Observable<PrenatalExam[]> {
        return this.http.get<PrenatalExam[]>(`${this.url}/pregnancy/${pregnancyId}/pending`);
    }

    createExam(pregnancyId: number, data: Partial<PrenatalExam>): Observable<PrenatalExam> {
        return this.http.post<PrenatalExam>(`${this.url}/pregnancy/${pregnancyId}`, data);
    }

    markAsDone(examId: number, data: Partial<PrenatalExam>): Observable<PrenatalExam> {
        return this.http.put<PrenatalExam>(`${this.url}/${examId}/done`, data);
    }

    deleteExam(examId: number): Observable<void> {
        return this.http.delete<void>(`${this.url}/${examId}`);
    }

    updateExam(examId: number, data: Partial<PrenatalExam>): Observable<PrenatalExam> {
    return this.http.put<PrenatalExam>(`${this.url}/${examId}`, data);
}
getAllExamsAdmin(): Observable<PrenatalExam[]> {
    return this.http.get<PrenatalExam[]>(`${this.url}/admin/all`);
}
}
