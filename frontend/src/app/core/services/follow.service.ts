import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserSummary } from '../models/user-summary.model';
import { getStoredToken } from './token.helper';

interface ApiResponse<T> { data: T; message?: string; }

@Injectable({ providedIn: 'root' })
export class FollowService {

  private readonly API = 'http://localhost:8081/api/follows';
  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = getStoredToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  follow(targetId: number): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.API}/${targetId}`, {}, { headers: this.headers() })
      .pipe(map(() => void 0));
  }

  unfollow(targetId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${targetId}`, { headers: this.headers() })
      .pipe(map(() => void 0));
  }

  getFollowing(userId: number): Observable<UserSummary[]> {
    return this.http.get<any>(`${this.API}/${userId}/following`, { headers: this.headers() })
      .pipe(map(res => res.data ?? res));
  }

  getFollowers(userId: number): Observable<UserSummary[]> {
    return this.http.get<any>(`${this.API}/${userId}/followers`, { headers: this.headers() })
      .pipe(map(res => res.data ?? res));
  }

  getSuggestions(): Observable<UserSummary[]> {
    return this.http.get<ApiResponse<UserSummary[]>>(`${this.API}/suggestions`, { headers: this.headers() })
      .pipe(map(r => r.data));
  }

  getAllUsers(): Observable<UserSummary[]> {
    return this.http.get<any>(`${this.API}/all-users`, { headers: this.headers() })
      .pipe(map(res => res.data ?? res));
  }
}