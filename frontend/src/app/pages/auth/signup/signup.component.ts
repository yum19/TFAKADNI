import { Component } from '@angular/core';
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
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { PasswordStrengthComponent } from '../../../components/password-strength/password-strength.component';

const passwordMatchValidator: ValidatorFn = (group: AbstractControl) => {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-signup',
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
          <h1 class="card-title">Create account</h1>
          <p class="card-sub">Join us today — it's free</p>
        </div>

        <div *ngIf="errorMessage" class="alert-inline is-danger">{{ errorMessage }}</div>

        <form [formGroup]="signupForm" (ngSubmit)="onSubmit()">
          <div class="name-row">
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>First name</mat-label>
              <input matInput formControlName="firstName" placeholder="Amina" />
              <mat-error>Requis</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Last name</mat-label>
              <input matInput formControlName="lastName" placeholder="Ben Ali" />
              <mat-error>Requis</mat-error>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="w-100">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" placeholder="you@example.com" />
            <mat-icon matSuffix>email</mat-icon>
            <mat-error *ngIf="signupForm.get('email')?.hasError('email')">Email invalide</mat-error>
          </mat-form-field>

          <app-password-strength class="w-100"></app-password-strength>

          <mat-form-field appearance="outline" class="w-100">
            <mat-label>Password</mat-label>
            <input matInput formControlName="password"
              [type]="hidePassword ? 'password' : 'text'" placeholder="Min. 8 characters" />
            <button matIconButton matSuffix (click)="hidePassword = !hidePassword" type="button">
              <mat-icon class="material-icons-outlined">{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="signupForm.get('password')?.hasError('minlength')">Minimum 8 caractères</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-100">
            <mat-label>Confirm password</mat-label>
            <input matInput formControlName="confirmPassword"
              [type]="hideConfirmPassword ? 'password' : 'text'" placeholder="Repeat your password" />
            <button matIconButton matSuffix (click)="hideConfirmPassword = !hideConfirmPassword" type="button">
              <mat-icon class="material-icons-outlined">{{ hideConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="signupForm.hasError('passwordMismatch')">Les mots de passe ne correspondent pas</mat-error>
          </mat-form-field>

          <div class="referral-field">
            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Referral code (optional)</mat-label>
              <input matInput formControlName="referralCode"
                placeholder="MAMA-ABC123" style="text-transform:uppercase" />
              <mat-icon matSuffix class="material-icons-outlined">card_giftcard</mat-icon>
            </mat-form-field>
          </div>

          <button class="btn-primary w-100 submit-btn" type="submit"
            [disabled]="signupForm.invalid || loading">
            <mat-spinner *ngIf="loading" diameter="18"
              style="--mdc-circular-progress-active-indicator-color:white"></mat-spinner>
            {{ loading ? 'Création…' : 'Create account' }}
          </button>
        </form>

        <p class="signup-row">
          Already have an account? <a routerLink="/auth/login" class="signup-link">Sign in</a>
        </p>
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
      max-width: 480px;
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

    .name-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .referral-field { margin-top: -4px; }

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
      margin-top: 4px;

      &:hover:not(:disabled) { background: #d63660; }
      &:active:not(:disabled) { transform: scale(0.99); }
      &:disabled { opacity: 0.55; cursor: not-allowed; }
    }

    .submit-btn { margin-bottom: 0; }

    .alert-inline {
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 13px;
      margin-bottom: 16px;

      &.is-danger {
        background: rgba(232,67,108,0.08);
        color: #c0243a;
        border-left: 3px solid #e8436c;
      }
    }

    .signup-row {
      text-align: center;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      margin: 1.25rem 0 0;
    }

    .signup-link {
      color: #e8436c;
      font-weight: 600;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
  `]
})
export class SignupComponent {
  signupForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
    const refCode = this.route.snapshot.queryParamMap.get('ref') || '';
    this.signupForm = this.fb.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
        referralCode: [refCode],
      },
      { validators: passwordMatchValidator }
    );
  }

  onSubmit(): void {
    if (this.signupForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';

    const { firstName, lastName, email, password, referralCode } = this.signupForm.value;

    this.authService.register({ firstName, lastName, email, password, referralCode: referralCode?.toUpperCase() || undefined }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/auth/signup-success']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message ?? 'Une erreur est survenue.';
      },
    });
  }
}