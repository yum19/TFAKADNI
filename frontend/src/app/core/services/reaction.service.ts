import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReactionSummary, ReactionType } from '../models/reaction.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReactionService {
  private readonly postApi    = `${environment.apiUrl}/posts`;
  private readonly commentApi = `${environment.apiUrl}/comments`;

  readonly sessionId: string = this._getOrCreateSessionId();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ── POST reactions ─────────────────────────────────────────

  getPostSummary(postId: number): Observable<ReactionSummary> {
    const params = new HttpParams().set('sessionId', this.sessionId);
    return this.http.get<ReactionSummary>(`${this.postApi}/${postId}/reactions`, { params, headers: this.getHeaders() });
  }

  reactToPost(postId: number, type: ReactionType): Observable<ReactionSummary> {
    const params = new HttpParams()
      .set('sessionId', this.sessionId)
      .set('type', type);
    return this.http.post<ReactionSummary>(`${this.postApi}/${postId}/reactions`, null, { params, headers: this.getHeaders() });
  }

  // ── COMMENT reactions ──────────────────────────────────────

  getCommentSummary(commentId: number): Observable<ReactionSummary> {
    const params = new HttpParams().set('sessionId', this.sessionId);
    return this.http.get<ReactionSummary>(`${this.commentApi}/${commentId}/reactions`, { params, headers: this.getHeaders() });
  }

  reactToComment(commentId: number, type: ReactionType): Observable<ReactionSummary> {
    const params = new HttpParams()
      .set('sessionId', this.sessionId)
      .set('type', type);
    return this.http.post<ReactionSummary>(`${this.commentApi}/${commentId}/reactions`, null, { params, headers: this.getHeaders() });
  }

  // ── backward-compat aliases ────────────────────────────────
  getSummary(postId: number)                { return this.getPostSummary(postId); }
  react(postId: number, type: ReactionType) { return this.reactToPost(postId, type); }

  private _getOrCreateSessionId(): string {
    const KEY = 'community_session_id';
    let id = localStorage.getItem(KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(KEY, id); }
    return id;
  }
}