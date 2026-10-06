import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { FaceIdService } from '../../../core/services/face-id.service';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatCardModule, MatInputModule, MatCheckboxModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatProgressSpinnerModule,
    MatSnackBarModule, ReactiveFormsModule, FormsModule, RouterModule, NgIf,
  ],
template: `
<div class="login-shell">
  <div class="login-wrapper">

    <!-- ══ 2FA STEP ══ -->
    <div *ngIf="twoFaRequired" class="login-card twofa-card">
      <div class="twofa-icon">🔐</div>
      <h2 class="card-title">Vérification en 2 étapes</h2>
      <p class="card-sub">Code envoyé à <strong>{{ twoFaEmail }}</strong></p>
      <p class="timer-badge">⏱ Expire dans {{ timerDisplay }}</p>

      <mat-form-field appearance="outline" class="w-100 code-field">
        <mat-label>Code à 6 chiffres</mat-label>
        <input matInput [(ngModel)]="twoFaCode" maxlength="6" type="text"
               placeholder="000000"
               style="text-align:center;font-size:28px;letter-spacing:10px;font-weight:700"
               (keyup.enter)="verify2fa()" />
      </mat-form-field>

      <div *ngIf="twoFaError" class="alert-inline"
           [class.is-success]="twoFaError === 'Nouveau code envoyé !'">
        {{ twoFaError }}
      </div>

      <button class="btn-primary w-100" (click)="verify2fa()" [disabled]="twoFaLoading">
        <mat-spinner *ngIf="twoFaLoading" diameter="18" style="--mdc-circular-progress-active-indicator-color:white"></mat-spinner>
        {{ twoFaLoading ? 'Vérification…' : 'Valider le code' }}
      </button>

      <div class="twofa-actions">
        <button class="link-btn" (click)="resend2fa()">Renvoyer le code</button>
        <button class="link-btn muted" (click)="cancel2fa()">Annuler</button>
      </div>
    </div>

    <!-- ══ MAIN LOGIN CARD ══ -->
    <div *ngIf="!twoFaRequired" class="login-card">

      <!-- Header -->
      <div class="card-header-block" *ngIf="step !== 'camera'">
        <div class="brand-dot"></div>
        <h1 class="card-title" *ngIf="step === 'home'">Welcome back</h1>
        <h1 class="card-title" *ngIf="step === 'email'">Face ID</h1>
        <p class="card-sub" *ngIf="step === 'home'">Sign in to continue</p>
        <p class="card-sub" *ngIf="step === 'email'">Enter your email to continue</p>
      </div>

      <!-- ── Step: home – Face ID button ── -->
      <div *ngIf="step === 'home'" class="step-home">
        <button class="btn-faceid" (click)="step = 'email'">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M7 3H5C3.9 3 3 3.9 3 5V7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M17 3H19C20.1 3 21 3.9 21 5V7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M7 21H5C3.9 21 3 20.1 3 19V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M17 21H19C20.1 21 21 20.1 21 19V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="9" cy="10" r="1" fill="currentColor"/>
            <circle cx="15" cy="10" r="1" fill="currentColor"/>
            <path d="M9 15c0 0 1 2 3 2s3-2 3-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M12 7V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Se connecter avec Face ID
        </button>

        <div class="divider"><span>ou avec email</span></div>
      </div>

      <!-- ── Step: email – Face ID email ── -->
      <div *ngIf="step === 'email'" class="step-email">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Email</mat-label>
          <input matInput [(ngModel)]="faceEmail" type="email"
                 placeholder="votre@email.com"
                 (keyup.enter)="loadFaceAndOpenCamera()" />
          <mat-icon matSuffix>email</mat-icon>
        </mat-form-field>

        <div *ngIf="faceError" class="alert-inline is-danger">{{ faceError }}</div>

        <button class="btn-primary w-100" (click)="loadFaceAndOpenCamera()"
                [disabled]="!faceEmail || faceLoading">
          <mat-spinner *ngIf="faceLoading" diameter="18"
            style="--mdc-circular-progress-active-indicator-color:white"></mat-spinner>
          {{ faceLoading ? 'Chargement…' : 'Continuer' }}
        </button>

        <button class="link-btn muted mt-3 d-block mx-auto" (click)="goBack()">
          ← Retour à la connexion
        </button>

        <div class="divider mt-4"><span>ou avec email</span></div>
      </div>

      <!-- ── Step: camera ── -->
      <div *ngIf="step === 'camera'" class="step-camera">
        <div class="camera-header">
          <h2 class="card-title">Vérification du visage</h2>
          <p class="card-sub">{{ faceEmail }}</p>
        </div>
        <div class="camera-frame">
          <video #videoLogin autoplay playsinline muted
                 style="width:100%;border-radius:16px;transform:scaleX(-1);display:block"></video>
          <div class="face-oval"></div>
        </div>
        <p *ngIf="faceStatus" class="camera-status">{{ faceStatus }}</p>
        <div *ngIf="faceError" class="alert-inline is-danger">{{ faceError }}</div>
        <div class="camera-actions">
          <button class="btn-primary" (click)="verifyFace()" [disabled]="faceLoading">
            {{ faceLoading ? '…' : 'Valider' }}
          </button>
          <button class="btn-outline" (click)="cancelFaceLogin()">Annuler</button>
        </div>
      </div>

      <!-- Global error -->
      <div *ngIf="errorMessage && step !== 'camera'" class="alert-inline is-danger">
        {{ errorMessage }}
      </div>

      <!-- ── Email / password form ── -->
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" *ngIf="step !== 'camera'">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" placeholder="Enter your email" />
          <mat-icon matSuffix>email</mat-icon>
          <mat-error *ngIf="loginForm.get('email')?.hasError('required')">Email requis</mat-error>
          <mat-error *ngIf="loginForm.get('email')?.hasError('email')">Email invalide</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Password</mat-label>
          <input matInput formControlName="password"
            [type]="hidePassword ? 'password' : 'text'" placeholder="Enter your password" />
          <button matIconButton matSuffix (click)="hidePassword = !hidePassword" type="button">
            <mat-icon class="material-icons-outlined">{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          <mat-error *ngIf="loginForm.get('password')?.hasError('required')">Mot de passe requis</mat-error>
        </mat-form-field>

        <div class="form-row-meta">
          <mat-checkbox>Remember me</mat-checkbox>
          <a routerLink="/auth/forgot-password" class="forgot-link">Forgot password?</a>
        </div>

        <button class="btn-primary w-100 submit-btn" type="submit"
                [disabled]="loginForm.invalid || loading">
          <mat-spinner *ngIf="loading" diameter="18"
            style="--mdc-circular-progress-active-indicator-color:white"></mat-spinner>
          {{ loading ? 'Connexion…' : 'Sign In' }}
        </button>

        <p class="signup-row">
          No account? <a routerLink="/auth/signup" class="signup-link">Create one</a>
        </p>
      </form>
    </div>

    <!-- Social login -->
    <div *ngIf="!twoFaRequired" class="social-section">
      <div class="divider"><span>OR continue with</span></div>
      <div class="social-row">
        <button class="btn-social" (click)="loginWithGoogle()">
          <img src="assets/img/g-logo.png" alt="Google" width="20" height="20" />
          Google
        </button>
      </div>
    </div>

  </div>
</div>
`,

styles: [`
  :host { 
    display: block;
  }

  .login-shell {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    padding: 2rem 1rem;
  }

  .login-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .login-card {
    background: var(--mat-sys-surface);
    border: 1px solid var(--mat-sys-outline-variant);
    border-radius: 24px;
    padding: 2.5rem 2.5rem 2rem;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  }

  .twofa-card {
    text-align: center;
    padding: 3rem 2.5rem;
  }

  .twofa-icon {
    font-size: 52px;
    margin-bottom: 1rem;
    line-height: 1;
  }

  .card-header-block {
    margin-bottom: 1.75rem;
  }

  .brand-dot {
    width: 32px;
    height: 6px;
    background: linear-gradient(90deg, #e8436c, #f472b6);
    border-radius: 3px;
    margin-bottom: 1rem;
  }

  .card-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--mat-sys-on-surface);
    margin: 0 0 6px;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  .card-sub {
    font-size: 15px;
    color: var(--mat-sys-on-surface-variant);
    margin: 0;
  }

  .timer-badge {
    display: inline-block;
    font-size: 13px;
    font-weight: 600;
    color: #e8436c;
    background: rgba(232,67,108,0.08);
    padding: 4px 12px;
    border-radius: 20px;
    margin-bottom: 1.5rem;
  }

  .btn-primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px 24px;
    background: #e8436c;
    color: white;
    border: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
    margin-top: 4px;

    &:hover:not(:disabled) { background: #d63660; }
    &:active:not(:disabled) { transform: scale(0.99); }
    &:disabled { opacity: 0.55; cursor: not-allowed; }
  }

  .btn-outline {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    background: transparent;
    color: var(--mat-sys-on-surface);
    border: 1px solid var(--mat-sys-outline-variant);
    border-radius: 14px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;

    &:hover { background: var(--mat-sys-surface-container); }
  }

  .btn-faceid {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 14px;
    background: var(--mat-sys-surface-container-low);
    border: 1px solid var(--mat-sys-outline-variant);
    border-radius: 14px;
    font-size: 15px;
    font-weight: 500;
    color: var(--mat-sys-on-surface);
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
    margin-bottom: 1.25rem;

    &:hover {
      background: var(--mat-sys-surface-container);
      border-color: var(--mat-sys-outline);
    }

    svg { color: var(--mat-sys-on-surface); }
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--mat-sys-on-surface-variant);
    font-size: 13px;
    margin: 1rem 0;

    &::before, &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--mat-sys-outline-variant);
      opacity: 0.6;
    }
  }

  .form-row-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    margin-top: -4px;
  }

  .forgot-link {
    font-size: 13px;
    color: #e8436c;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }

  .submit-btn {
    margin-top: 0;
    padding: 15px;
    font-size: 16px;
    border-radius: 14px;
  }

  .signup-row {
    text-align: center;
    font-size: 14px;
    color: var(--mat-sys-on-surface-variant);
    margin: 1rem 0 0;
  }

  .signup-link {
    color: #e8436c;
    font-weight: 600;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }

  .link-btn {
    background: none;
    border: none;
    color: #e8436c;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    padding: 0;

    &.muted { color: var(--mat-sys-on-surface-variant); }
    &:hover { text-decoration: underline; }
  }

  .twofa-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--mat-sys-outline-variant);
  }

  .alert-inline {
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 13px;
    margin-bottom: 12px;
    background: rgba(232,67,108,0.08);
    color: #c0243a;
    border-left: 3px solid #e8436c;

    &.is-success {
      background: rgba(16,185,129,0.08);
      color: #065f46;
      border-left-color: #10b981;
    }

    &.is-danger {
      background: rgba(232,67,108,0.08);
      color: #c0243a;
      border-left-color: #e8436c;
    }
  }

  .step-camera {
    .camera-header { text-align: center; margin-bottom: 1.25rem; }
    .camera-frame {
      position: relative;
      max-width: 260px;
      margin: 0 auto 1rem;
    }
    .face-oval {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -58%);
      width: 120px; height: 155px;
      border: 2.5px solid #e8436c;
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
      pointer-events: none;
    }
    .camera-status {
      text-align: center;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 8px;
    }
    .camera-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-top: 12px;

      .btn-primary { width: auto; padding: 12px 28px; }
    }
  }

  .social-section {
    padding: 0 4px;
  }

  .social-row {
    display: flex;
    justify-content: center;
  }

  .btn-social {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 28px;
    background: var(--mat-sys-surface);
    border: 1px solid var(--mat-sys-outline-variant);
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: var(--mat-sys-on-surface);
    cursor: pointer;
    transition: background 0.2s;

    &:hover { background: var(--mat-sys-surface-container); }
  }

  .code-field { margin: 1rem 0 0.5rem; }
`]
})
export class LoginComponent implements OnInit, OnDestroy {
  @ViewChild('videoLogin') videoRef!: ElementRef<HTMLVideoElement>;

  loginForm: FormGroup;
  hidePassword = true;
  loading      = false;
  errorMessage = '';

  // Face ID steps
  step: 'home' | 'email' | 'camera' = 'home';
  faceEmail   = '';
  faceLoading = false;
  faceStatus  = '';
  faceError   = '';
  private facePhoto    = '';
  private faceCreds    = '';
  private faceProvider = '';
  private stream: MediaStream | null = null;

  // 2FA
  twoFaRequired = false;
  twoFaEmail    = '';
  twoFaCode     = '';
  twoFaLoading  = false;
  twoFaError    = '';
  twoFaTimer    = 300;
  private timerInterval: any;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private faceIdService: FaceIdService,
    private snackBar: MatSnackBar,
    private sessionService: SessionService
  ) {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit(): void {
    this.faceIdService.preloadModels();
  }

  private getRedirectRoute(): string {
    const role = this.sessionService.role;
    switch (role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'PARTNER':
        return '/partner/home';
      case 'USER':
      default:
        return '/mother/home';
    }
  }

  goBack(): void {
    this.step      = 'home';
    this.faceError = '';
    this.faceEmail = '';
  }

  // ── Login email/password avec vérification 2FA ────────────────────────────

  onSubmit(): void {
    // if (this.loginForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    const { email, password } = this.loginForm.value;

    fetch('http://localhost:8081/api/auth/2fa/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    .then(r => r.json())
    .then(data => {
      this.loading = false;
      if (!data.success) {
        this.errorMessage = data.message || 'Erreur de connexion.';
        return;
      }
      if (data.data?.requires2fa) {
        // 2FA requis → afficher le champ code
        this.twoFaRequired = true;
        this.twoFaEmail    = data.data.email;
        this.startTimer();
      } else {
        // 2FA désactivé → login classique
        this.authService.login({ email, password }).subscribe({
          next: () => this.router.navigate([this.getRedirectRoute()]),
          error: (err) => { this.errorMessage = err?.error?.message ?? 'Erreur.'; }
        });
      }
    })
    .catch(() => { this.loading = false; this.errorMessage = 'Erreur réseau.'; });
  }

  // ── 2FA ───────────────────────────────────────────────────────────────────

  verify2fa(): void {
    if (!this.twoFaCode || this.twoFaCode.length !== 6) {
      this.twoFaError = 'Entrez le code à 6 chiffres.';
      return;
    }
    this.twoFaLoading = true;
    this.twoFaError   = '';

    fetch('http://localhost:8081/api/auth/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.twoFaEmail, code: this.twoFaCode })
    })
    .then(r => r.json())
    .then(data => {
      this.twoFaLoading = false;
      if (data.success && data.data?.accessToken) {
        this.authService.setSession(data.data as any);
        clearInterval(this.timerInterval);
        this.router.navigate([this.getRedirectRoute()]);
      } else {
        this.twoFaError = data.message || 'Code incorrect.';
      }
    })
    .catch(() => { this.twoFaLoading = false; this.twoFaError = 'Erreur réseau.'; });
  }

  resend2fa(): void {
    fetch('http://localhost:8081/api/auth/2fa/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.twoFaEmail })
    }).then(() => {
      this.twoFaTimer = 300;
      this.twoFaCode  = '';
      this.twoFaError = 'Nouveau code envoyé !';
    });
  }

  cancel2fa(): void {
    this.twoFaRequired = false;
    this.twoFaCode     = '';
    this.twoFaError    = '';
    clearInterval(this.timerInterval);
  }

  private startTimer(): void {
    this.twoFaTimer = 300;
    this.timerInterval = setInterval(() => {
      this.twoFaTimer--;
      if (this.twoFaTimer <= 0) {
        clearInterval(this.timerInterval);
        this.twoFaError = 'Code expiré. Renvoyez un code.';
      }
    }, 1000);
  }

  get timerDisplay(): string {
    const m = Math.floor(this.twoFaTimer / 60);
    const s = this.twoFaTimer % 60;
    return m + ':' + (s < 10 ? '0' + s : s);
  }

  // ── Face ID ───────────────────────────────────────────────────────────────

  async loadFaceAndOpenCamera(): Promise<void> {
    if (!this.faceEmail) return;
    this.faceLoading = true;
    this.faceError   = '';

    const data = await this.faceIdService.loadForLogin(this.faceEmail);
    if (!data.hasPhoto) {
      this.faceLoading = false;
      this.faceError   = 'Aucun Face ID configuré pour cet email.';
      return;
    }
    this.facePhoto    = data.facePhoto;
    this.faceCreds    = data.faceCreds;
    this.faceProvider = (data as any).provider ?? '';
    this.faceLoading  = false;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      this.step = 'camera';
      setTimeout(() => {
        if (this.videoRef?.nativeElement)
          this.videoRef.nativeElement.srcObject = this.stream;
      }, 150);
    } catch {
      this.faceError = 'Impossible d\'accéder à la caméra.';
    }
  }

  async verifyFace(): Promise<void> {
    const video = this.videoRef?.nativeElement;
    if (!video) return;
    this.faceLoading = true;
    this.faceError   = '';
    this.faceStatus  = 'Analyse du visage...';

    await new Promise(r => setTimeout(r, 300));

    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth  || 320;
    canvas.height = video.videoHeight || 240;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    const captured = canvas.toDataURL('image/jpeg', 0.9);

    const match = await this.faceIdService.compareFaces(this.facePhoto, captured);

    if (match) {
      this.faceStatus = '✅ Visage reconnu !';
      this.stopStream();
      this.step = 'home';

      if (!this.faceCreds || this.faceProvider === 'GOOGLE') {
        await this.loginViaFaceBackend(this.faceEmail);
      } else {
        try {
          const creds = JSON.parse(decodeURIComponent(escape(atob(this.faceCreds))));
          this.authService.login(creds).subscribe({
            next: () => { this.faceLoading = false; this.router.navigate([this.getRedirectRoute()]); },
            error: () => this.loginViaFaceBackend(this.faceEmail),
          });
        } catch {
          await this.loginViaFaceBackend(this.faceEmail);
        }
      }
    } else {
      this.faceLoading = false;
      this.faceError   = 'Visage non reconnu. Regardez bien la caméra et réessayez.';
    }
  }

  private async loginViaFaceBackend(email: string): Promise<void> {
    try {
      const res  = await fetch('http://localhost:8081/api/faceid/face-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data?.data?.accessToken) {
        this.authService.setSession(data.data as any);
        this.faceLoading = false;
        this.router.navigate([this.getRedirectRoute()]);
      } else {
        this.faceLoading  = false;
        this.errorMessage = 'Échec connexion Face ID.';
      }
    } catch {
      this.faceLoading  = false;
      this.errorMessage = 'Erreur de connexion au serveur.';
    }
  }

  cancelFaceLogin(): void {
    this.stopStream();
    this.step       = 'home';
    this.faceError  = '';
    this.faceStatus = '';
    this.faceEmail  = '';
  }

  private stopStream(): void {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  loginWithGoogle(): void { this.authService.loginWithGoogle(); }
  ngOnDestroy(): void { this.stopStream(); clearInterval(this.timerInterval); }
}