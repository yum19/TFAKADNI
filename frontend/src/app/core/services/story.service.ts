import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Story } from '../models/story.model';

@Injectable({ providedIn: 'root' })
export class StoryService {
  private readonly api = `${environment.apiUrl}/stories`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  create(story: Story): Observable<Story> {
    return this.http.post<Story>(this.api, story, { headers: this.getHeaders() });
  }

  getActiveStories(): Observable<Story[]> {
    return this.http.get<Story[]>(this.api, { headers: this.getHeaders() });
  }

  getById(id: number): Observable<Story> {
    return this.http.get<Story>(`${this.api}/${id}`, { headers: this.getHeaders() });
  }

  cleanupExpired(): Observable<any> {
    return this.http.delete(`${this.api}/cleanup`, { headers: this.getHeaders() });
  }

  getInfo(): Observable<any> {
    return this.http.get(`${this.api}/info`, { headers: this.getHeaders() });
  }
}