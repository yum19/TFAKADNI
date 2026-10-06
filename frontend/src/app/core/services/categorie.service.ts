import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categorie } from '../models/categorie.model';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class CategorieService {
  
  private readonly API = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(this.API);
  }

  getById(id: number): Observable<Categorie> {
    return this.http.get<Categorie>(`${this.API}/${id}`);
  }

  create(categorie: Categorie): Observable<Categorie> {
    return this.http.post<Categorie>(this.API, categorie);
  }
}