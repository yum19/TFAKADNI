import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SupportResourceRequestDto {
  title: string;
  type: string;
  category: string;
  description?: string;
  url?: string;
  contentText?: string;
  phoneNumber?: string;
  thumbnailUrl?: string;
  displayMode?: string;
  estimatedMinutes?: number;
  isRecommended?: boolean;
  language: string;
  riskLevelTarget: string;
  isActive?: boolean;
}

export interface SupportResourceResponseDto {
  id: number;
  title: string;
  type: string;
  category: string;
  description?: string;
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

@Injectable({
  providedIn: 'root'
})
export class AdminSupportResourceService {
  private readonly API_URL = `${environment.apiUrl}/admin/postpartum/resources`;

  private readonly ACCESS_TOKEN =
    'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJBRE1JTiIsInR5cGUiOiJBQ0NFU1MiLCJpYXQiOjE3NzY2MjAyMDEsImV4cCI6MTc3NzIyNTAwMX0.3dUfOySb42r_3vlSRu9gK16aobLKA2VuzEKKa_4_JZykgWohIoqLo-1Bmm1yhhYqFenQn8Sdh6gvpoBHniaR1g';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    });
  }

  getAllResourcesAdmin(): Observable<SupportResourceResponseDto[]> {
    return this.http.get<SupportResourceResponseDto[]>(this.API_URL, {
      headers: this.getHeaders()
    });
  }

  createResource(resource: SupportResourceRequestDto): Observable<SupportResourceResponseDto> {
    return this.http.post<SupportResourceResponseDto>(this.API_URL, resource, {
      headers: this.getHeaders()
    });
  }

  updateResource(id: number, resource: SupportResourceRequestDto): Observable<SupportResourceResponseDto> {
    return this.http.put<SupportResourceResponseDto>(
      `${this.API_URL}/${id}`,
      resource,
      { headers: this.getHeaders() }
    );
  }

  deleteResource(id: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/${id}`, {
      headers: this.getHeaders(),
      responseType: 'text'
    });
  }

  activateResource(id: number): Observable<SupportResourceResponseDto> {
    return this.http.put<SupportResourceResponseDto>(
      `${this.API_URL}/${id}/activate`,
      {},
      { headers: this.getHeaders() }
    );
  }
}