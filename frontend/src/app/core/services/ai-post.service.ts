// src/app/core/services/ai-post.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AiPostService {
  private api = `${environment.apiUrl}/ai`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({ Authorization: `Bearer ${token ?? ''}` });
  }

  autocomplete(prefix: string): Observable<string[]> {
    if (!prefix?.trim()) return of([]);
    return this.http.get<string[]>(`${this.api}/autocomplete`, {
      params: { prefix },
      headers: this.getHeaders(),
    });
  }

  generatePost(topic: string, tag: string): Observable<{ content: string }> {
    return this.http.post<{ content: string }>(
      `${this.api}/generate-post`,
      { topic, tag },
      { headers: this.getHeaders() }
    );
  }
}