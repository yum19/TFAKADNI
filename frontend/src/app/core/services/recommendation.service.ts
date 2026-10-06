import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ProductRecommendation {
  productId: number;
  nom: string;
  description: string;
  prix: number;
  stock: number;
  images: string[];
  categorie: string;
  aiReason: string;
  relevanceScore: number;
}

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private base = `${environment.apiUrl}/recommendations`;

  constructor(private http: HttpClient) {}

  getProductRecommendations(): Observable<ProductRecommendation[]> {
  // Make sure this key matches what your login sets
  const token = localStorage.getItem('access_token')   // ← verify this key name
             ?? localStorage.getItem('token')
             ?? localStorage.getItem('jwt');
  
  const headers = token
    ? new HttpHeaders({ Authorization: `Bearer ${token}` })
    : new HttpHeaders();

  return this.http.get<any>(`${this.base}/products`, { headers }).pipe(
    map(r => {
      // Your existing ApiResponse wrapper: { success, message, data: [] }
      if (Array.isArray(r?.data))     return r.data;
      if (Array.isArray(r))           return r;
      return [];
    }),
    catchError(err => {
      console.error('[RecSvc] error:', err.status, err.message);
      return of([]);
    })
  );
}

  
}