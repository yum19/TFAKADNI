import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Commande } from '../models/commande.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CommandeService {
  private readonly api = `${environment.apiUrl}/commandes`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAll(): Observable<Commande[]> {
    return this.http.get<Commande[]>(this.api, { headers: this.getHeaders() });
  }

  getById(id: number): Observable<Commande> {
    return this.http.get<Commande>(`${this.api}/${id}`, { headers: this.getHeaders() });
  }

  create(commande: Commande): Observable<Commande> {
    return this.http.post<Commande>(this.api, commande, { headers: this.getHeaders() });
  }

  update(id: number, commande: Commande): Observable<Commande> {
    return this.http.put<Commande>(`${this.api}/${id}`, commande, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`, { headers: this.getHeaders() });
  }
}