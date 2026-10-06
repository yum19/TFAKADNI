import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface StoryRequestDto {
  periodType?: string;
  tone?: string;
  voiceType?: string;
}

export interface StoryResponseDto {
  id: number;
  motherId: number;
  periodType: string;
  tone: string;
  title: string;
  storyText: string;
  highlights: string[];
  audioGenerated: boolean;
  audioUrl?: string;
  voiceType?: string;
  createdAt: string;
}

export interface StoryAudioResponseDto {
  storyId: number;
  audioGenerated: boolean;
  audioUrl: string;
  voiceType: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorytellingService {
  private readonly baseUrl = `${environment.apiUrl}/postpartum/storytelling`;

  private readonly TOKEN =
    'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.TOKEN}`,
    });
  }

  generateStory(body: StoryRequestDto): Observable<StoryResponseDto> {
    return this.http.post<StoryResponseDto>(`${this.baseUrl}/generate`, body, {
      headers: this.getHeaders(),
    });
  }

  getLatestStory(): Observable<StoryResponseDto> {
    return this.http.get<StoryResponseDto>(`${this.baseUrl}/latest`, {
      headers: this.getHeaders(),
    });
  }

  getStoryHistory(): Observable<StoryResponseDto[]> {
    return this.http.get<StoryResponseDto[]>(`${this.baseUrl}/history`, {
      headers: this.getHeaders(),
    });
  }

  getStoryById(id: number): Observable<StoryResponseDto> {
    return this.http.get<StoryResponseDto>(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  deleteStory(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders(),
      responseType: 'text',
    });
  }

  generateAudio(
    storyId: number,
    voiceType: string = 'SOFT_FEMALE'
  ): Observable<StoryAudioResponseDto> {
    const params = new HttpParams().set('voiceType', voiceType);

    return this.http.post<StoryAudioResponseDto>(
      `${this.baseUrl}/${storyId}/generate-audio`,
      {},
      {
        params,
        headers: this.getHeaders(),
      }
    );
  }

  buildAbsoluteAudioUrl(audioUrl?: string | null): string {
    if (!audioUrl) {
      return '';
    }

    if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
      return audioUrl;
    }

    return `${environment.apiUrl.replace(/\/api$/, '')}${audioUrl}`;
  }
}