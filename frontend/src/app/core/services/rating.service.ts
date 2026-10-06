// src/app/core/services/rating.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RatingRequest {
  matchId: number;
  stars:   number;
  comment?: string;
}

export interface RatingDTO {
  id?:           number;
  matchId?:      number;
  raterId?:      number;
  ratedId?:      number;
  stars?:        number;
  comment?:      string;
  createdAt?:    string;
  avgStars?:     number;
  totalRatings?: number;
}

@Injectable({ providedIn: 'root' })
export class RatingService {
  private http = inject(HttpClient);
  private API  = 'http://localhost:8081/api/ratings';

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('auth_token')
               ?? localStorage.getItem('token')
               ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  /** Submit or update a rating */
  rate(req: RatingRequest): Observable<RatingDTO> {
    return this.http.post<RatingDTO>(this.API, req, { headers: this.headers });
  }

  /** Get caller's existing rating for a match (null = not yet rated) */
  getMyRating(matchId: number): Observable<RatingDTO | null> {
    return this.http.get<RatingDTO>(`${this.API}/mine`, {
      headers: this.headers,
      params: { matchId: matchId.toString() }
    });
  }

  /** Get average + count for any user */
  getUserStats(userId: number): Observable<RatingDTO> {
    return this.http.get<RatingDTO>(`${this.API}/user/${userId}`, {
      headers: this.headers
    });
  }
}