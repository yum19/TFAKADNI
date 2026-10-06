import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ApiResponse,
  UserResponse,
} from '../models/auth.models';

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'current_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${environment.apiUrl}/auth`;

  // Signal réactif — utilisé dans les templates et guards
  currentUser = signal<UserResponse | null>(this.loadUser());
  isLoggedIn = signal<boolean>(!!this.getToken());

  constructor(private http: HttpClient, private router: Router, private sessionService: SessionService) {}

  // ── Register ───────────────────────────────────────────────────────────────

  register(payload: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.api}/register`, payload)
      .pipe(tap((res) => this.saveSession(res.data)));
  }

  // ── Login ──────────────────────────────────────────────────────────────────

  login(payload: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.api}/login`, payload)
      .pipe(tap((res) => this.saveSession(res.data)));
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  logout(): Observable<ApiResponse<void>> {
    const refreshToken = this.getRefreshToken();
    const body: RefreshTokenRequest = { refreshToken: refreshToken ?? '' };
    return this.http
      .post<ApiResponse<void>>(`${this.api}/logout`, body)
      .pipe(tap(() => {
        this.clearSession();
        this.router.navigate(['/auth/login']);
      }));
  }

  logoutLocal(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  // ── Refresh token ──────────────────────────────────────────────────────────

  refreshToken(): Observable<ApiResponse<AuthResponse>> {
    const refreshToken = this.getRefreshToken();
    const body: RefreshTokenRequest = { refreshToken: refreshToken ?? '' };
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.api}/refresh`, body)
      .pipe(
        tap((res) => this.saveSession(res.data)),
        catchError((err) => {
          this.clearSession();
          this.router.navigate(['/auth/login']);
          return throwError(() => err);
        })
      );
  }

  // ── Forgot / Reset Password ────────────────────────────────────────────────

  forgotPassword(payload: ForgotPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.api}/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.api}/reset-password`, payload);
  }

  // ── Token helpers ──────────────────────────────────────────────────────────

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  private loadUser(): UserResponse | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  private saveSession(auth: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, auth.accessToken);
    localStorage.setItem(REFRESH_KEY, auth.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    this.currentUser.set(auth.user);
    this.isLoggedIn.set(true);
    this.sessionService.setAuth({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      tokenType: auth.tokenType,
      expiresIn: auth.expiresIn,
      user: auth.user,
    });
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.sessionService.clear();
  }

  updateCurrentUser(user: UserResponse): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    const authPayload = this.sessionService.auth;
    if (authPayload) {
      this.sessionService.setAuth({
        ...authPayload,
        user,
      });
    }
  }

  setSession(auth: AuthResponse): void {
    this.saveSession(auth);
  }

  loginWithGoogle(): void {
    const backendUrl = environment.apiUrl.replace(/\/api$/, '');
    window.location.href = `${backendUrl}/oauth2/authorization/google`;
  }

  saveOAuth2Session(accessToken: string, refreshToken: string): void {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    // Décoder le JWT pour extraire les infos user
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const user: UserResponse = {
        id: 0,
        firstName: '',
        lastName: '',
        email: payload.sub,
        role: payload.role ?? 'USER',
        provider: 'GOOGLE',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      this.currentUser.set(user);
      this.isLoggedIn.set(true);
      this.sessionService.setAuth({
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 0,
        user,
      });
    } catch {
      this.isLoggedIn.set(true);
    }
  }
}