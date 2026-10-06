import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Produit } from '../models/produit.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProduitService {
  private readonly api = `${environment.apiUrl}/produits`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAll(): Observable<Produit[]> {
    return this.http.get<Produit[]>(this.api, { headers: this.getHeaders() });
  }

  getById(id: number): Observable<Produit> {
    return this.http.get<Produit>(`${this.api}/${id}`, { headers: this.getHeaders() });
  }

  create(produit: Produit): Observable<Produit> {
    return this.http.post<Produit>(this.api, produit, { headers: this.getHeaders() });
  }

  update(id: number, produit: Produit): Observable<Produit> {
    return this.http.put<Produit>(`${this.api}/${id}`, produit, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`, { headers: this.getHeaders() });
  }
}