import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  constructor(private http: HttpClient) {}

  searchCity(query: string): Observable<any[]> {
    const headers = new HttpHeaders({
      'Accept-Language': 'fr'
    });

    const url =
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;

    return this.http.get<any[]>(url, { headers });
  }
}