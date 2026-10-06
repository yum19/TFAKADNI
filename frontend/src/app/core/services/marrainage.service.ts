import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MarraineDTO {
  userId: number;
  fullName: string;
  city: string;
  currentWeek: number;
  pregnancyType: string;
  compatibilityScore: number;
  reason: string;
  hasBaby: boolean;
}

@Injectable({ providedIn: 'root' })
export class MarrainageService {
  private http = inject(HttpClient);
  private API = 'http://localhost:8081/api/marrainage';

  private get authHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  findBestMatches(): Observable<MarraineDTO[]> {  // ← no parameter needed
    return this.http.post<MarraineDTO[]>(
      `${this.API}/match`,
      {},                          // empty body — backend reads user from JWT
      { headers: this.authHeaders }
    );
  }

}