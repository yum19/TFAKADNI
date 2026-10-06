import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post, Commentaire } from '../models/post.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly api             = `${environment.apiUrl}/posts`;
  private readonly apiCommentaires = `${environment.apiUrl}/commentaires`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    if (!token) console.error('❌ auth_token missing from localStorage');
    return new HttpHeaders({
      'Authorization': `Bearer ${token ?? ''}`,
      'Content-Type': 'application/json'
    });
  }

  // ─── POSTS ─────────────────────────────────────────────────

  getAll(): Observable<Post[]> {
    return this.http.get<Post[]>(this.api, { headers: this.getHeaders() });
  }

  getById(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.api}/${id}`, { headers: this.getHeaders() });
  }

  create(post: Post): Observable<Post> {
    return this.http.post<Post>(this.api, post, { headers: this.getHeaders() });
  }

  update(id: number, post: Post): Observable<Post> {
    return this.http.put<Post>(`${this.api}/${id}`, post, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`, { headers: this.getHeaders() });
  }

  // ─── COMMENTAIRES ──────────────────────────────────────────

  getComments(postId: number): Observable<Commentaire[]> {
    return this.http.get<Commentaire[]>(
      `${this.api}/${postId}/comments`,
      { headers: this.getHeaders() }
    );
  }

  addComment(postId: number, contenu: string): Observable<Commentaire> {
    const body = { contenu, anonyme: false };
    return this.http.post<Commentaire>(
      `${this.api}/${postId}/comments`,   // ← POST /api/posts/{postId}/comments
      body,
      { headers: this.getHeaders() }
    );
  }

  updateComment(postId: number, commentId: number, contenu: string): Observable<Commentaire> {
    const body = { contenu, anonyme: false };
    return this.http.put<Commentaire>(
      `${this.apiCommentaires}/${commentId}`,  // PUT /api/commentaires/{id}
      body,
      { headers: this.getHeaders() }
    );
  }

  deleteComment(postId: number, commentId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiCommentaires}/${commentId}`,  // DELETE /api/commentaires/{id}
      { headers: this.getHeaders() }
    );
  }
}