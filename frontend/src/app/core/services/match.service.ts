// src/app/core/services/match.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface MatchDTO {
  matchId:                number;
  otherUserId:            number;
  otherUserName:          string;
  otherUserCity:          string;
  otherUserWeek:          number;
  otherUserPregnancyType: string;
  otherUserHasBaby:       boolean;
  aiScore:                number;
  reason:                 string;
  myStatus:    'PENDING' | 'ACCEPTED' | 'REJECTED';
  theirStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  iAmA:        boolean;
  mutualMatch: boolean;

  // Template-friendly aliases
  fullName?:           string;
  city?:               string;
  currentWeek?:        number;
  hasBaby?:            boolean;
  compatibilityScore?: number;
}

export function normaliseMatch(m: MatchDTO): MatchDTO {
  return {
    ...m,
    fullName:           m.fullName           ?? m.otherUserName,
    city:               m.city               ?? m.otherUserCity,
    currentWeek:        m.currentWeek        ?? m.otherUserWeek,
    hasBaby:            m.hasBaby            ?? m.otherUserHasBaby,
    compatibilityScore: m.compatibilityScore ?? m.aiScore,
    mutualMatch:        m.mutualMatch        ?? false,
  };
}

@Injectable({ providedIn: 'root' })
export class MatchService {
  private http = inject(HttpClient);
  private API  = 'http://localhost:8081/api/matches';

  private _matches$    = new BehaviorSubject<MatchDTO[]>([]);
  readonly matches$    = this._matches$.asObservable();

  private _swipeQueue$ = new BehaviorSubject<MatchDTO[]>([]);
  readonly swipeQueue$ = this._swipeQueue$.asObservable();

  noPregnancyData = false;

  get currentMatches(): MatchDTO[] { return this._matches$.getValue(); }

  /**
   * Reads the JWT from localStorage.
   *
   * ── HOW TO FIND YOUR KEY ──────────────────────────────────────────────────
   * Open browser DevTools → Application → Local Storage → http://localhost:4200
   * Look for the key that holds your JWT (a long string starting with "eyJ").
   * Common key names: 'token', 'jwt', 'authToken', 'access_token'
   *
   * Replace ALL occurrences of 'token' below with your actual key if different.
   * ─────────────────────────────────────────────────────────────────────────
   */
  private get authHeaders(): HttpHeaders {
    const token =localStorage.getItem('access_token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  /** POST /generate — JWT identifies who is requesting matches */
  generateMatches(): Observable<MatchDTO[]> {
  return this.http.post<MatchDTO[]>(
    `${this.API}/generate`, {},
    { headers: this.authHeaders }
  ).pipe(
    tap(raw => {
      console.log('[MatchService] raw response:', raw); // ← add temporarily

      if (!raw || raw.length === 0) {
        this.noPregnancyData = true;
        this._swipeQueue$.next([]);
        return;
      }

      this.noPregnancyData = false;
      const matches = raw.map(normaliseMatch);

      // Log what statuses came back so you can see why queue might be empty
      console.log('[MatchService] statuses:', matches.map(m => ({
        id: m.matchId,
        myStatus: m.myStatus
      })));

      const pending = matches.filter(m => m.myStatus === 'PENDING');
      console.log('[MatchService] pending count:', pending.length);

      this._swipeQueue$.next(pending);
      this._mergeMatches(matches);
    })
  );
}
  /** POST /decide — JWT identifies who is deciding */
  decide(matchId: number, decision: 'ACCEPTED' | 'REJECTED'): Observable<MatchDTO> {
    return this.http.post<MatchDTO>(
      `${this.API}/decide`,
      { matchId, decision },  // NO userId in body — backend reads it from JWT
      { headers: this.authHeaders }
    ).pipe(
      tap(raw => this._updateMatch(normaliseMatch(raw)))
    );
  }

  /** GET /mine — JWT identifies whose matches to return */
  loadMyMatches(): Observable<MatchDTO[]> {
    return this.http.get<MatchDTO[]>(
      `${this.API}/mine`,
      { headers: this.authHeaders }
    ).pipe(
      tap(raw => this._matches$.next(raw.map(normaliseMatch)))
    );
  }

  popSwipeCard(): MatchDTO | null {
    const q = [...this._swipeQueue$.getValue()];
    if (q.length === 0) return null;
    const card = q.shift()!;
    this._swipeQueue$.next(q);
    return card;
  }

  private _mergeMatches(incoming: MatchDTO[]): void {
    const map = new Map(this._matches$.getValue().map(m => [m.matchId, m]));
    incoming.forEach(m => map.set(m.matchId, m));
    this._matches$.next([...map.values()]);
  }

  private _updateMatch(updated: MatchDTO): void {
    this._matches$.next(
      this._matches$.getValue().map(m =>
        m.matchId === updated.matchId ? updated : m)
    );
  }
}