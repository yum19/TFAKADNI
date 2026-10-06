import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BabyName {
  name:    string;
  origin:  string;
  meaning: string;
  poem:    string;
}

export interface BabyNamePrefs {
  gender:  'girl' | 'boy' | 'both';
  origin:  string;
  style:   string;
  letter:  string;
  meaning: string;
}

export interface BabyNameResponse {
  names: BabyName[];
}

@Injectable({ providedIn: 'root' })
export class BabyNameService {

  private readonly API = `${environment.apiUrl}/ai/baby-names`;

  constructor(private http: HttpClient) {}

  generateNames(prefs: BabyNamePrefs): Observable<BabyNameResponse> {
    return this.http.post<BabyNameResponse>(this.API, prefs);
  }
}