import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, timer, EMPTY } from 'rxjs';
import { catchError, map, switchMap, take, filter, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PostAnalysis } from '../models/post-analysis.model';

@Injectable({ providedIn: 'root' })
export class HarmfulContentService {

  private readonly api = `${environment.apiUrl}/posts`;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}`,
      'Content-Type': 'application/json',
    });
  }

  private unwrap(res: any): PostAnalysis {
    return (res?.data ?? res) as PostAnalysis;
  }

  // ── Get stored analysis ───────────────────────────────────────────────────

  getAnalysis(postId: number): Observable<PostAnalysis | null> {
    return this.http
      .get<any>(`${this.api}/${postId}/analysis`, { headers: this.headers() })
      .pipe(
        map(res => this.unwrap(res)),
        catchError(() => of(null))
      );
  }

  /**
   * Trigger synchronous analysis immediately (called right after post creation
   * so the author gets the warning without waiting for polling).
   */
  triggerAnalysis(postId: number, text: string, imageUrls: string[] = []): Observable<PostAnalysis | null> {
    return this.http
      .post<any>(
        `${this.api}/${postId}/analysis/trigger`,
        { text, imageUrls },
        { headers: this.headers() }
      )
      .pipe(
        map(res => this.unwrap(res)),
        catchError(() => of(null))
      );
  }

  /**
   * Smart polling — starts after initialDelayMs, polls every intervalMs.
   * Stops as soon as the DB row shows isHarmful is defined (analysis complete).
   * Max attempts: maxAttempts (default 6 → up to ~5.5s total wait).
   *
   * This is needed because Spring @Async fires after the HTTP response,
   * so the DB row may not exist yet when Angular first asks for it.
   */
  pollUntilReady(
    postId:         number,
    initialDelayMs: number = 600,
    intervalMs:     number = 900,
    maxAttempts:    number = 6
  ): Observable<PostAnalysis | null> {
    return timer(initialDelayMs, intervalMs).pipe(
      switchMap(() => this.getAnalysis(postId)),
      tap(a => {
        if (a) console.log(`[harmful poll] postId=${postId} isHarmful=${a.isHarmful} severity=${a.severity}`);
      }),
      take(maxAttempts),
      catchError(() => of(null))
    );
  }

  // ── Acknowledge ───────────────────────────────────────────────────────────

  acknowledge(postId: number): Observable<PostAnalysis | null> {
    return this.http
      .post<any>(
        `${this.api}/${postId}/analysis/acknowledge`,
        {},
        { headers: this.headers() }
      )
      .pipe(
        map(res => this.unwrap(res)),
        catchError(() => of(null))
      );
  }

  // ── Display logic ─────────────────────────────────────────────────────────

  /** True if post should be blurred for this user */
  shouldShowBlur(analysis: PostAnalysis | null, isAuthor: boolean): boolean {
    if (!analysis || !analysis.isHarmful) return false;
    if (isAuthor) return false;
    return analysis.shouldBlur === true;
  }

  /** True if author warning banner should be shown */
  shouldShowAuthorWarning(analysis: PostAnalysis | null, isAuthor: boolean): boolean {
    if (!analysis || !analysis.isHarmful) return false;
    if (!isAuthor) return false;
    return !analysis.authorAcknowledged;
  }
}