// src/app/core/services/saved-post.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { SavedPostResponse, ToggleSaveResponse } from '../models/saved-post.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SavedPostService {

  private readonly api = `${environment.apiUrl}/saved-posts`;

  /** Emits the current saved-post count so the sidebar can react live. */
  private _savedCount$ = new BehaviorSubject<number>(0);
  readonly savedCount$ = this._savedCount$.asObservable();

  /** Set of postIds the user has saved — kept in sync on toggle. */
  private _savedIds = new Set<number>();

  constructor(private http: HttpClient) {}

  // ── helpers ─────────────────────────────────────────────────────────────────

  private headers(): HttpHeaders {
    const token = localStorage.getItem('auth_token') ?? '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ── API calls ────────────────────────────────────────────────────────────────

  /**
   * Toggle save/unsave for a post.
   * Updates local cache so the UI can reflect the change instantly.
   */
  toggle(postId: number): Observable<ToggleSaveResponse> {
    return this.http
      .post<ToggleSaveResponse>(`${this.api}/${postId}/toggle`, {}, { headers: this.headers() })
      .pipe(
        tap(res => {
          if (res.saved) {
            this._savedIds.add(postId);
          } else {
            this._savedIds.delete(postId);
          }
          this._savedCount$.next(res.count);
        })
      );
  }

  /** Check save status for a single post. */
  checkStatus(postId: number): Observable<{ saved: boolean }> {
    return this.http.get<{ saved: boolean }>(
      `${this.api}/status/${postId}`,
      { headers: this.headers() }
    );
  }

  /** Fetch all saved posts for the current user. */
  getSaved(): Observable<SavedPostResponse[]> {
    return this.http.get<SavedPostResponse[]>(this.api, { headers: this.headers() });
  }

  /** Fetch the current saved count and push it to the stream. */
  refreshCount(): Observable<{ count: number }> {
    return this.http
      .get<{ count: number }>(`${this.api}/count`, { headers: this.headers() })
      .pipe(tap(r => this._savedCount$.next(r.count)));
  }

  // ── local helpers ────────────────────────────────────────────────────────────

  /** Synchronously check if a postId is saved (after hydration). */
  isSavedLocally(postId: number): boolean {
    return this._savedIds.has(postId);
  }

  /** Seed the local set from a list of saved responses (call after getSaved). */
  hydrate(saved: SavedPostResponse[]): void {
    this._savedIds = new Set(saved.map(s => s.postId));
    this._savedCount$.next(saved.length);
  }

  get currentCount(): number {
    return this._savedCount$.value;
  }
}