import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    RouterModule, MatCardModule, MatInputModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatProgressSpinnerModule,
    ReactiveFormsModule, NgIf,
  ],
  template: `
  <div class="login-shell">
    <div class="login-wrapper">
      <div class="login-card">

        <div class="card-header-block">
          <div class="brand-dot"></div>
          <h1 class="card-title">Reset password</h1>
          <p class="card-sub">Enter your email and we'll send you a reset link</p>
        </div>

        <div *ngIf="successMessage" class="alert-inline is-success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="flex-shrink:0">
            <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ successMessage }}
        </div>

        <div *ngIf="errorMessage" class="alert-inline is-danger">{{ errorMessage }}</div>

        <form *ngIf="!successMessage" [formGroup]="forgotForm" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="w-100">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" placeholder="you@example.com" />
            <mat-icon matSuffix>email</mat-icon>
            <mat-error>Email invalide</mat-error>
          </mat-form-field>

          <button class="btn-primary w-100 submit-btn" type="submit"
            [disabled]="forgotForm.invalid || loading">
            <mat-spinner *ngIf="loading" diameter="18"
              style="--mdc-circular-progress-active-indicator-color:white"></mat-spinner>
            {{ loading ? 'Envoi…' : 'Send reset link' }}
          </button>
        </form>

        <div *ngIf="successMessage" class="success-actions">
          <button class="btn-outline w-100" routerLink="/auth/login">
            Back to sign in
          </button>
        </div>
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

    .btn-outline {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 14px;
      background: transparent;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 14px;
      font-size: 15px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
      cursor: pointer;
      transition: background 0.2s;
      &:hover { background: var(--mat-sys-surface-container); }
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

      &.is-danger {
        background: rgba(232,67,108,0.08);
        color: #c0243a;
        border-left: 3px solid #e8436c;
      }

      &.is-success {
        background: rgba(16,185,129,0.08);
        color: #065f46;
        border-left: 3px solid #10b981;
      }
    }

    .success-actions { margin-top: 1rem; }

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
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';

    this.authService.forgotPassword(this.forgotForm.value).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage =
          res.message ?? 'Si cet email existe, un lien de réinitialisation a été envoyé.';
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message ?? 'Une erreur est survenue.';
      },
    });
  }
}
