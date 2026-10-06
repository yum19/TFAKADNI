import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Panier } from '../models/panier.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PanierService {
  private readonly api = `${environment.apiUrl}/paniers`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getById(id: number): Observable<Panier> {
    return this.http.get<Panier>(`${this.api}/${id}`, { headers: this.getHeaders() });
  }

  create(panier: Panier): Observable<Panier> {
    return this.http.post<Panier>(this.api, panier, { headers: this.getHeaders() });
  }

  update(id: number, panier: Panier): Observable<Panier> {
    return this.http.put<Panier>(`${this.api}/${id}`, panier, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`, { headers: this.getHeaders() });
  }

  
}