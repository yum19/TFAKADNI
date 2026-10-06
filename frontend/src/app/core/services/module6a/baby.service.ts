import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface BabyRequestDTO {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  birthWeight?: number;
  birthHeight?: number;
  bloodType?: string | null;
  birthPlace?: string | null;
  photoUrl?: string | null;
  notes?: string | null;
  deliveryType?: string | null;
  gestationalAgeAtBirth?: number;
}

export interface BabyResponseDTO {
  id: number;
  motherId: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  birthWeight?: number;
  birthHeight?: number;
  bloodType?: string | null;
  birthPlace?: string | null;
  photoUrl?: string | null;
  notes?: string | null;
  deliveryType?: string | null;
  gestationalAgeAtBirth?: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class BabyService {
  private readonly API_URL = `${environment.apiUrl}/babies`;
  // Token pour les tests - À remplacer par un token dynamique une fois le login implémenté
  private readonly TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.TOKEN}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Create a new baby
   */
  createBaby(request: BabyRequestDTO): Observable<BabyResponseDTO> {
    return this.http.post<BabyResponseDTO>(
      this.API_URL,
      request,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get all babies for authenticated user
   */
  getMyBabies(): Observable<BabyResponseDTO[]> {
    return this.http.get<BabyResponseDTO[]>(
      `${this.API_URL}/my-babies`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get a specific baby by ID
   */
  getBabyById(babyId: number): Observable<BabyResponseDTO> {
    return this.http.get<BabyResponseDTO>(
      `${this.API_URL}/${babyId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Update a baby's information
   */
  updateBaby(babyId: number, request: BabyRequestDTO): Observable<BabyResponseDTO> {
    return this.http.put<BabyResponseDTO>(
      `${this.API_URL}/${babyId}`,
      request,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Delete a baby (soft delete)
   */
  deleteBaby(babyId: number): Observable<string> {
    return this.http.delete(
      `${this.API_URL}/${babyId}`,
      { responseType: 'text', headers: this.getHeaders() }
    );
  }
}
