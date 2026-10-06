import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { PasswordStrengthComponent } from '../../../components/password-strength/password-strength.component';

const passwordMatchValidator: ValidatorFn = (group: AbstractControl) => {
  const p = group.get('newPassword')?.value;
  const c = group.get('confirmPassword')?.value;
  return p === c ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    MatCardModule, MatInputModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatProgressSpinnerModule,
    ReactiveFormsModule, RouterModule, NgIf, PasswordStrengthComponent,
  ],
  template: `
  <div class="login-shell">
    <div class="login-wrapper">
      <div class="login-card">

        <div class="card-header-block">
          <div class="brand-dot"></div>
          <h1 class="card-title">New password</h1>
          <p class="card-sub">Choose a strong password for your account</p>
        </div>

        <div *ngIf="!resetToken" class="alert-inline is-warning">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;margin-top:1px">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>
            Lien invalide ou expiré.
            <a routerLink="/auth/forgot-password" class="inline-link">Refaire une demande →</a>
          </span>
        </div>

        <div *ngIf="errorMessage" class="alert-inline is-danger">{{ errorMessage }}</div>

        <form *ngIf="resetToken" [formGroup]="changeForm" (ngSubmit)="onSubmit()">
          <app-password-strength class="w-100"></app-password-strength>

          <mat-form-field appearance="outline" class="w-100">
            <mat-label>New password</mat-label>
            <input matInput formControlName="newPassword"
              [type]="hideNew ? 'password' : 'text'" placeholder="Min. 8 characters" />
            <button matIconButton matSuffix (click)="hideNew = !hideNew" type="button">
              <mat-icon class="material-icons-outlined">{{ hideNew ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="changeForm.get('newPassword')?.hasError('minlength')">Minimum 8 caractères</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-100">
            <mat-label>Confirm new password</mat-label>
            <input matInput formControlName="confirmPassword"
              [type]="hideConfirm ? 'password' : 'text'" placeholder="Repeat new password" />
            <button matIconButton matSuffix (click)="hideConfirm = !hideConfirm" type="button">
              <mat-icon class="material-icons-outlined">{{ hideConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="changeForm.hasError('passwordMismatch')">Les mots de passe ne correspondent pas</mat-error>
          </mat-form-field>

          <button class="btn-primary w-100 submit-btn" type="submit"
            [disabled]="changeForm.invalid || loading">
            <mat-spinner *ngIf="loading" diameter="18"
              style="--mdc-circular-progress-active-indicator-color:white"></mat-spinner>
            {{ loading ? 'Mise à jour…' : 'Update password' }}
          </button>
        </form>
      </div>

      <p class="bottom-link">
        Remember your password? <a routerLink="/auth/login" class="signup-link">Sign in</a>
      </p>
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
      max-width: 480px;
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

    .card-header-block { margin-bottom: 1.75rem; }

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

    .btn-primary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 15px 24px;
      background: #e8436c;
      color: white;
      border: none;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;

      &:hover:not(:disabled) { background: #d63660; }
      &:active:not(:disabled) { transform: scale(0.99); }
      &:disabled { opacity: 0.55; cursor: not-allowed; }
    }

    .submit-btn { margin-top: 4px; }

    .alert-inline {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 13px;
      margin-bottom: 16px;
      line-height: 1.5;

      &.is-danger {
        background: rgba(232,67,108,0.08);
        color: #c0243a;
        border-left: 3px solid #e8436c;
      }

      &.is-warning {
        background: rgba(234,179,8,0.08);
        color: #713f12;
        border-left: 3px solid #eab308;
      }
    }

    .inline-link {
      color: inherit;
      font-weight: 600;
      text-decoration: underline;
    }

    .bottom-link {
      text-align: center;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      margin: 0;
    }

    .signup-link {
      color: #e8436c;
      font-weight: 600;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
  `]
})
export class ChangePasswordComponent implements OnInit {
  changeForm: FormGroup;
  hideNew = true;
  hideConfirm = true;
  loading = false;
  errorMessage = '';
  resetToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.changeForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    // Le lien envoyé par email : /auth/reset-password?token=xxxxx
    this.resetToken = this.route.snapshot.queryParamMap.get('token');
  }

  onSubmit(): void {
    if (this.changeForm.invalid || !this.resetToken) return;
    this.loading = true;
    this.errorMessage = '';

    this.authService
      .resetPassword({
        token: this.resetToken,
        newPassword: this.changeForm.value.newPassword,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage =
            err?.error?.message ?? 'Lien expiré ou invalide. Refaites la demande.';
        },
      });
  }
}
