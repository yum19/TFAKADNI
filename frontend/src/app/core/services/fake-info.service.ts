// src/app/core/services/fake-info.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FakeInfoAnalysis } from '../models/fake-info.model';

@Injectable({ providedIn: 'root' })
export class FakeInfoService {

  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`
    });
  }

  /** Fetch fake-info analysis for one post */
  getAnalysis(postId: number): Observable<FakeInfoAnalysis | null> {
    return this.http
      .get<FakeInfoAnalysis>(`${this.base}/posts/${postId}/fake-info`,
        { headers: this.headers })
      .pipe(catchError(() => of(null)));
  }
}