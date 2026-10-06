import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AiTextResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AiService {
  private http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  summarizeGuide(guideId: number): Observable<AiTextResponse> {
    return this.http.post<AiTextResponse>(`${this.api}/module7/ai/partner-guides/${guideId}/summarize`, {});
  }

  simplifyModule(moduleId: number): Observable<AiTextResponse> {
    return this.http.post<AiTextResponse>(`${this.api}/module7/ai/course-modules/${moduleId}/simplify`, {});
  }

  generatePartnerTips(pregnancyId: number): Observable<AiTextResponse> {
    return this.http.post<AiTextResponse>(`${this.api}/module7/ai/pregnancies/${pregnancyId}/partner-tips`, {});
  }

  explainCorrection(quizAttemptId: number): Observable<AiTextResponse> {
    return this.http.post<AiTextResponse>(`${this.api}/module7/ai/quiz-attempts/${quizAttemptId}/explain-correction`, {});
  }
}
