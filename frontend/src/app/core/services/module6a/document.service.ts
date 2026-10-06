import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type DocumentType = 'ORDONNANCE' | 'COMPTE_RENDU' | 'ANALYSE' | 'RADIO' | 'AUTRE';

export interface BabyDocumentRequestDTO {
  title: string;
  documentType: DocumentType;
  fileUrl: string;
  fileSize?: number;
  notes?: string;
}

export interface BabyDocumentResponseDTO {
  id: number;
  babyId: number;
  title: string;
  documentType: DocumentType;
  fileUrl: string;
  fileSize?: number;
  notes?: string;
  uploadedAt: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly API_URL = `${environment.apiUrl}/babies`;
  private readonly TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.TOKEN}`
    });
  }

  private getJsonHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.TOKEN}`,
      'Content-Type': 'application/json'
    });
  }

  createDocument(babyId: number, formData: FormData): Observable<BabyDocumentResponseDTO> {
    return this.http.post<BabyDocumentResponseDTO>(
      `${this.API_URL}/${babyId}/documents`,
      formData,
      { headers: this.getAuthHeaders() }
    );
  }

  getAllDocumentsByBaby(babyId: number): Observable<BabyDocumentResponseDTO[]> {
    return this.http.get<BabyDocumentResponseDTO[]>(
      `${this.API_URL}/${babyId}/documents`,
      { headers: this.getAuthHeaders() }
    );
  }

  getDocumentById(babyId: number, documentId: number): Observable<BabyDocumentResponseDTO> {
    return this.http.get<BabyDocumentResponseDTO>(
      `${this.API_URL}/${babyId}/documents/${documentId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  updateDocument(babyId: number, documentId: number, formData: FormData): Observable<BabyDocumentResponseDTO> {
    return this.http.put<BabyDocumentResponseDTO>(
      `${this.API_URL}/${babyId}/documents/${documentId}`,
      formData,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteDocument(babyId: number, documentId: number): Observable<string> {
    return this.http.delete(
      `${this.API_URL}/${babyId}/documents/${documentId}`,
      {
        headers: this.getAuthHeaders(),
        responseType: 'text'
      }
    );
  }

  getLatestDocument(babyId: number): Observable<BabyDocumentResponseDTO> {
    return this.http.get<BabyDocumentResponseDTO>(
      `${this.API_URL}/${babyId}/documents/latest`,
      { headers: this.getAuthHeaders() }
    );
  }

  getDocumentsByType(babyId: number, documentType: DocumentType): Observable<BabyDocumentResponseDTO[]> {
    return this.http.get<BabyDocumentResponseDTO[]>(
      `${this.API_URL}/${babyId}/documents/type/${documentType}`,
      { headers: this.getAuthHeaders() }
    );
  }
}