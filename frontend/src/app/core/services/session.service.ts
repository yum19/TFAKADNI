import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthPayload, UserSummary } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly storageKey = 'mamaai-auth';
  private readonly authSubject = new BehaviorSubject<AuthPayload | null>(this.read());
  readonly auth$ = this.authSubject.asObservable();

  private read(): AuthPayload | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthPayload;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  setAuth(payload: AuthPayload): void {
    localStorage.setItem(this.storageKey, JSON.stringify(payload));
    this.authSubject.next(payload);
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
    this.authSubject.next(null);
  }

  get auth(): AuthPayload | null {
    return this.authSubject.value;
  }

  get user(): UserSummary | null {
    return this.auth?.user ?? null;
  }

  get accessToken(): string | null {
    return this.auth?.accessToken ?? null;
  }

  get refreshToken(): string | null {
    return this.auth?.refreshToken ?? null;
  }

  get isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  get role(): UserSummary['role'] | null {
    return this.user?.role ?? null;
  }

  get userId(): number | null {
    return this.user?.id ?? null;
  }

  get fullName(): string {
    return [this.user?.firstName, this.user?.lastName].filter(Boolean).join(' ');
  }
}
