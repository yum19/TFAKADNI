import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface HealingMissionResponseDto {
  id: number;
  title: string;
  description: string;
  missionType: string;
  difficulty: string;
  pointsReward: number;
  durationSeconds: number;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  status: string;
  completedToday: boolean;
  expectedText?: string | null;
  expectedVoiceStyle?: string | null;
  minimumPassingScore?: number | null;
}

export interface HealingMissionCompleteRequestDto {
  notes?: string;
}

export interface HealingMissionCompleteResponseDto {
  missionId: number;
  message: string;
  pointsEarned: number;
  totalPoints: number;
  currentLevel: number;
  currentStreak: number;
}

export interface HealingBadgeResponseDto {
  id: number;
  name: string;
  description: string;
  icon: string;
  badgeType: string;
  earnedAt?: string | null;
  earned: boolean;
}

export interface HealingStatsResponseDto {
  coins: number;
  totalPoints: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  completedMissionsCount: number;
  pointsToNextLevel: number;
}

export interface HealingDashboardResponseDto {
  todaysMissions: HealingMissionResponseDto[];
  recentHistory: HealingMissionResponseDto[];
  latestBadges: HealingBadgeResponseDto[];
  stats: HealingStatsResponseDto;
}

export interface VoiceMissionConfigResponseDto {
  missionId: number;
  expectedText: string;
  expectedVoiceStyle: string;
  minimumPassingScore: number;
  referenceAudioUrl: string | null;
}

export interface VoiceEvaluationResponseDto {
  missionId: number;
  expectedText: string;
  expectedVoiceStyle: string;
  detectedVoiceStyle: string;
  transcript: string;
  textScore: number;
  energyScore: number;
  paceScore: number;
  stabilityScore: number;
  pitchScore: number;
  finalScore: number;
  accepted: boolean;
  feedback: string;
}

@Injectable({
  providedIn: 'root'
})
export class HealingMissionService {
  private readonly baseUrl = `${environment.apiUrl}/postpartum/healing`;

  private readonly TOKEN =
    'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpa2JlbEJvdXpvdWl0YTIwQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTc3NjYxOTYwMCwiZXhwIjoxNzc3MjI0NDAwfQ.rYfsy-mzP78dbyHswcQ0RJG9dBpKynGhBO2UL9lncODvFbtNVW3CNIr28MuzDIZp_vKZNg8e2z-TsEKU-VQ98g';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.TOKEN}`,
      'Content-Type': 'application/json'
    });
  }

  private getMultipartHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.TOKEN}`
    });
  }

  getDashboard(): Observable<HealingDashboardResponseDto> {
    return this.http.get<HealingDashboardResponseDto>(`${this.baseUrl}/dashboard`, {
      headers: this.getHeaders()
    });
  }

  getAllMissions(): Observable<HealingMissionResponseDto[]> {
    return this.http.get<HealingMissionResponseDto[]>(`${this.baseUrl}/missions`, {
      headers: this.getHeaders()
    });
  }

  getTodayMissions(): Observable<HealingMissionResponseDto[]> {
    return this.http.get<HealingMissionResponseDto[]>(`${this.baseUrl}/missions/today`, {
      headers: this.getHeaders()
    });
  }

  getMissionById(id: number): Observable<HealingMissionResponseDto> {
    return this.http.get<HealingMissionResponseDto>(`${this.baseUrl}/missions/${id}`, {
      headers: this.getHeaders()
    });
  }

  startMission(id: number): Observable<HealingMissionResponseDto> {
    return this.http.post<HealingMissionResponseDto>(
      `${this.baseUrl}/missions/${id}/start`,
      {},
      { headers: this.getHeaders() }
    );
  }

  completeMission(
    id: number,
    body: HealingMissionCompleteRequestDto = {}
  ): Observable<HealingMissionCompleteResponseDto> {
    return this.http.post<HealingMissionCompleteResponseDto>(
      `${this.baseUrl}/missions/${id}/complete`,
      body,
      { headers: this.getHeaders() }
    );
  }

  skipMission(id: number): Observable<HealingMissionResponseDto> {
    return this.http.post<HealingMissionResponseDto>(
      `${this.baseUrl}/missions/${id}/skip`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getHistory(): Observable<HealingMissionResponseDto[]> {
    return this.http.get<HealingMissionResponseDto[]>(`${this.baseUrl}/history`, {
      headers: this.getHeaders()
    });
  }

  getStats(): Observable<HealingStatsResponseDto> {
    return this.http.get<HealingStatsResponseDto>(`${this.baseUrl}/stats`, {
      headers: this.getHeaders()
    });
  }

  getAllBadges(): Observable<HealingBadgeResponseDto[]> {
    return this.http.get<HealingBadgeResponseDto[]>(`${this.baseUrl}/badges`, {
      headers: this.getHeaders()
    });
  }

  getMyBadges(): Observable<HealingBadgeResponseDto[]> {
    return this.http.get<HealingBadgeResponseDto[]>(`${this.baseUrl}/badges/my`, {
      headers: this.getHeaders()
    });
  }

  getVoiceMissionConfig(id: number): Observable<VoiceMissionConfigResponseDto> {
    return this.http.get<VoiceMissionConfigResponseDto>(
      `${this.baseUrl}/missions/${id}/voice-config`,
      { headers: this.getHeaders() }
    );
  }

  evaluateVoiceMission(id: number, audioBlob: Blob): Observable<VoiceEvaluationResponseDto> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-recording.webm');

    return this.http.post<VoiceEvaluationResponseDto>(
      `${this.baseUrl}/missions/${id}/voice-evaluate`,
      formData,
      { headers: this.getMultipartHeaders() }
    );
  }

  failMission(id: number): Observable<HealingMissionResponseDto> {
    return this.http.post<HealingMissionResponseDto>(
      `${this.baseUrl}/missions/${id}/fail`,
      {},
      { headers: this.getHeaders() }
    );
  }
}