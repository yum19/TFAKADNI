import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SupportResourceResponseDto {
  id: number;
  title: string;
  type: string;
  category: string;
  description: string;
  url?: string;
  contentText?: string;
  phoneNumber?: string;
  thumbnailUrl?: string;
  displayMode?: string;
  estimatedMinutes?: number;
  isRecommended?: boolean;
  language: string;
  riskLevelTarget: string;
  isActive: boolean;
}

export interface SupportResourceFilters {
  riskLevel?: string;
  type?: string;
  category?: string;
  language?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupportResourceService {
  private readonly API_URL = `${environment.apiUrl}/postpartum/resources`;
  private readonly TOKEN =
    'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.TOKEN}`,
    });
  }

  getResources(filters?: SupportResourceFilters): Observable<SupportResourceResponseDto[]> {
    let params = new HttpParams();

    if (filters?.riskLevel) {
      params = params.set('riskLevel', filters.riskLevel);
    }
    if (filters?.type) {
      params = params.set('type', filters.type);
    }
    if (filters?.category) {
      params = params.set('category', filters.category);
    }
    if (filters?.language) {
      params = params.set('language', filters.language);
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<SupportResourceResponseDto[]>(this.API_URL, {
      params,
      headers: this.getHeaders(),
    });
  }

  getRecommendedResources(riskLevel?: string, language?: string): Observable<SupportResourceResponseDto[]> {
    let params = new HttpParams();

    if (riskLevel) {
      params = params.set('riskLevel', riskLevel);
    }
    if (language) {
      params = params.set('language', language);
    }

    return this.http.get<SupportResourceResponseDto[]>(`${this.API_URL}/recommended`, {
      params,
      headers: this.getHeaders(),
    });
  }

  getResourceById(id: number): Observable<SupportResourceResponseDto> {
    return this.http.get<SupportResourceResponseDto>(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
    });
  }
}