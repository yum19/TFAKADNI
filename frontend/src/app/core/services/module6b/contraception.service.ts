import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ContraceptionProfileRequestDto {
  age: string;
  isBreastfeeding: boolean;
  medicalHistory?: string;
  preference?: string;
}

export interface ContraceptionProfileResponseDto {
  id: number;
  motherId: number;
  age: string;
  isBreastfeeding: boolean;
  medicalHistory?: string;
  preference?: string;
  aiRecommendation?: string;
  createdAt: string;
}

export interface ContraceptionLogRequestDto {
  method: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  sideEffects?: string;
  notes?: string;
  status?: string;
}

export interface ContraceptionLogResponseDto {
  id: number;
  motherId: number;
  method: string;
  startDate?: string;
  endDate?: string;
  status: string;
  sideEffects?: string;
  notes?: string;
  createdAt: string;
}

export interface ContraceptionChatRequestDto {
  message: string;
  sessionId?: string;
}

export interface ContraceptionChatMessageResponseDto {
  id: number;
  motherId: number;
  role: string; // USER / ASSISTANT
  content: string;
  sessionId: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContraceptionService {
  private readonly API_URL = `${environment.apiUrl}/postpartum/contraception`;
  private readonly TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.TOKEN}`,
    });
  }

  // =========================
  // AI RECOMMENDATION
  // =========================

  /**
   * Get AI contraception recommendation
   */
  recommendMethod(
    profile: ContraceptionProfileRequestDto
  ): Observable<ContraceptionProfileResponseDto> {
    return this.http.post<ContraceptionProfileResponseDto>(
      `${this.API_URL}/recommend`,
      profile,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get all saved recommendations
   */
  getRecommendations(): Observable<ContraceptionProfileResponseDto[]> {
    return this.http.get<ContraceptionProfileResponseDto[]>(
      `${this.API_URL}/recommendations`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get one recommendation by ID
   */
  getRecommendationById(id: number): Observable<ContraceptionProfileResponseDto> {
    return this.http.get<ContraceptionProfileResponseDto>(
      `${this.API_URL}/recommendations/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Delete one recommendation
   */
  deleteRecommendation(id: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/recommendations/${id}`, {
      responseType: 'text',
      headers: this.getHeaders()
    });
  }

  // =========================
  // CHAT AI
  // =========================

  /**
   * Send chat message to AI
   */
  sendChatMessage(
    dto: ContraceptionChatRequestDto
  ): Observable<ContraceptionChatMessageResponseDto> {
    return this.http.post<ContraceptionChatMessageResponseDto>(
      `${this.API_URL}/chat`,
      dto,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get full chat history
   */
  getChatHistory(): Observable<ContraceptionChatMessageResponseDto[]> {
    return this.http.get<ContraceptionChatMessageResponseDto[]>(
      `${this.API_URL}/chat`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get one chat session by sessionId
   */
  getChatSession(sessionId: string): Observable<ContraceptionChatMessageResponseDto[]> {
    return this.http.get<ContraceptionChatMessageResponseDto[]>(
      `${this.API_URL}/chat/${sessionId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Delete one chat message
   */
  deleteChatMessage(id: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/chat/${id}`, {
      responseType: 'text',
      headers: this.getHeaders()
    });
  }

  // =========================
  // CONTRACEPTION LOGS
  // =========================

  /**
   * Create a contraception log
   */
  createLog(log: ContraceptionLogRequestDto): Observable<ContraceptionLogResponseDto> {
    return this.http.post<ContraceptionLogResponseDto>(
      `${this.API_URL}`,
      log,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get all contraception logs
   * Optional filter by status
   */
  getLogsByMother(status?: string): Observable<ContraceptionLogResponseDto[]> {
    let params = new HttpParams();

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ContraceptionLogResponseDto[]>(
      `${this.API_URL}`,
      { params, headers: this.getHeaders() }
    );
  }

  /**
   * Get active contraception log
   */
  getActiveLog(): Observable<ContraceptionLogResponseDto> {
    return this.http.get<ContraceptionLogResponseDto>(
      `${this.API_URL}/active`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get one log by ID
   */
  getLogById(id: number): Observable<ContraceptionLogResponseDto> {
    return this.http.get<ContraceptionLogResponseDto>(
      `${this.API_URL}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Update one log
   */
  updateLog(
    id: number,
    log: ContraceptionLogRequestDto
  ): Observable<ContraceptionLogResponseDto> {
    return this.http.put<ContraceptionLogResponseDto>(
      `${this.API_URL}/${id}`,
      log,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Stop active/current method
   */
  stopLog(id: number): Observable<ContraceptionLogResponseDto> {
    return this.http.put<ContraceptionLogResponseDto>(
      `${this.API_URL}/${id}/stop`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Delete one log
   */
  deleteLog(id: number): Observable<string> {
    return this.http.delete(`${this.API_URL}/${id}`, {
      responseType: 'text',
      headers: this.getHeaders()
    });
  }

  updateChatMessage(id: number, dto: ContraceptionChatRequestDto): Observable<ContraceptionChatMessageResponseDto> {
  return this.http.put<ContraceptionChatMessageResponseDto>(
    `${this.API_URL}/chat/${id}`,
    dto,
    { headers: this.getHeaders() }
  );
}
}