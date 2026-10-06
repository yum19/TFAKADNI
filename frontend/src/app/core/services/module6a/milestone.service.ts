import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type MilestoneCategory = 'MOTOR' | 'SOCIAL' | 'LANGUAGE' | 'COGNITIVE' | 'OTHER';
export type MediaType = 'PHOTO' | 'VIDEO' | 'AUDIO';

export interface BabyMilestoneRequestDTO {
  title: string;
  category: MilestoneCategory;
  milestoneDate: string; // YYYY-MM-DD
  description?: string;
  mediaUrl?: string;
  mediaType?: MediaType;
}

export interface BabyMilestoneResponseDTO {
  id: number;
  babyId: number;
  title: string;
  category: MilestoneCategory;
  milestoneDate: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  recent: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class MilestoneService {

  private readonly API_URL = `${environment.apiUrl}/babies`;

  // ⚠️ Token gardé comme tu veux
  private readonly TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  /**
   * Headers ONLY auth (important pour FormData)
   */
  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.TOKEN}`
    });
  }

  /**
   * Headers JSON (pour GET/DELETE si besoin)
   */
  private getJsonHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.TOKEN}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * ✅ CREATE (multipart)
   */
  createMilestone(babyId: number, formData: FormData): Observable<BabyMilestoneResponseDTO> {
    return this.http.post<BabyMilestoneResponseDTO>(
      `${this.API_URL}/${babyId}/milestones`,
      formData,
      { headers: this.getAuthHeaders() } // ⚠️ PAS de Content-Type
    );
  }

  /**
   * GET ALL
   */
  getAllMilestonesByBaby(babyId: number): Observable<BabyMilestoneResponseDTO[]> {
    return this.http.get<BabyMilestoneResponseDTO[]>(
      `${this.API_URL}/${babyId}/milestones`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * GET BY ID
   */
  getMilestoneById(babyId: number, milestoneId: number): Observable<BabyMilestoneResponseDTO> {
    return this.http.get<BabyMilestoneResponseDTO>(
      `${this.API_URL}/${babyId}/milestones/${milestoneId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * ✅ UPDATE (multipart)
   */
  updateMilestone(babyId: number, milestoneId: number, formData: FormData): Observable<BabyMilestoneResponseDTO> {
    return this.http.put<BabyMilestoneResponseDTO>(
      `${this.API_URL}/${babyId}/milestones/${milestoneId}`,
      formData,
      { headers: this.getAuthHeaders() } // ⚠️ PAS de Content-Type
    );
  }

  /**
   * DELETE
   */
  deleteMilestone(babyId: number, milestoneId: number): Observable<string> {
    return this.http.delete(
      `${this.API_URL}/${babyId}/milestones/${milestoneId}`,
      { headers: this.getAuthHeaders(), responseType: 'text' }
    );
  }

  /**
   * GET LATEST
   */
  getLatestMilestone(babyId: number): Observable<BabyMilestoneResponseDTO> {
    return this.http.get<BabyMilestoneResponseDTO>(
      `${this.API_URL}/${babyId}/milestones/latest`,
      { headers: this.getAuthHeaders() }
    );
  }
}