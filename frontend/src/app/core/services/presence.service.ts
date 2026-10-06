import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getStoredToken } from './token.helper';

@Injectable({ providedIn: 'root' })
export class PresenceService implements OnDestroy {

  private readonly API = 'http://localhost:8081/api/presence';
  private heartbeatInterval: any = null;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = getStoredToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  startHeartbeat(): void {
    this.sendHeartbeat();
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 30_000);
  }

  private sendHeartbeat(): void {
    this.http.post(`${this.API}/heartbeat`, {}, { headers: this.headers() })
      .subscribe({ error: () => {} });
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.http.post(`${this.API}/offline`, {}, { headers: this.headers() })
      .subscribe({ error: () => {} });
  }

  getOnlineEmails(): Observable<Set<string>> {
    return this.http.get<any>(`${this.API}/online`, { headers: this.headers() })
      .pipe(map(r => {
        const emails: string[] = Array.isArray(r) ? r : (r?.data ?? []);
        return new Set(emails.map((e: string) => e.toLowerCase()));
      }));
  }

  ngOnDestroy(): void {
    this.stopHeartbeat();
  }
}