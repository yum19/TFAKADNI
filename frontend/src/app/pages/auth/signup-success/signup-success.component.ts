import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-signup-success',
  standalone: true,
  imports: [MatIconModule, RouterModule],
  template: `
<div class="login-shell">
  <div class="login-wrapper">
    <div class="login-card success-card">

      <div class="success-icon-wrap">
        <div class="success-ring">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#e8436c" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <h1 class="card-title">Account created!</h1>
      <p class="card-sub">Welcome aboard. Your account is ready and all features are available to you.</p>

      <div class="role-section">
        <p class="role-label">Continue as</p>
        <div class="role-grid">
          <a routerLink="/mother/home" class="role-card">
            <div class="role-avatar" style="background: linear-gradient(135deg, #fce7f3, #fbcfe8)">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="#e8436c" stroke-width="1.75"/>
                <path d="M12 14c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4z" stroke="#e8436c" stroke-width="1.75" stroke-linejoin="round"/>
                <path d="M12 19v-3m0 0c0-1.5 1-2.5 1-2.5" stroke="#e8436c" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="role-name">Mother</span>
            <span class="role-desc">Courses, modules & suivi</span>
            <div class="role-arrow">→</div>
          </a>

          <a routerLink="/partner/home" class="role-card">
            <div class="role-avatar" style="background: linear-gradient(135deg, #ede9fe, #ddd6fe)">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="8" r="3.5" stroke="#7c3aed" stroke-width="1.75"/>
                <circle cx="17" cy="9" r="2.5" stroke="#7c3aed" stroke-width="1.5"/>
                <path d="M2 20c0-2.5 3-4 7-4s7 1.5 7 4" stroke="#7c3aed" stroke-width="1.75" stroke-linecap="round"/>
                <path d="M17 14c2 .5 4 1.5 4 3" stroke="#7c3aed" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="role-name">Partner</span>
            <span class="role-desc">Guides & accompagnement</span>
            <div class="role-arrow">→</div>
          </a>
        </div>
      </div>

      <div class="divider"><span>or</span></div>

      <a routerLink="/auth/login" class="btn-ghost">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5m0 0l7 7m-7-7l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back to sign in
      </a>
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

    .success-card { text-align: center; }

    .success-icon-wrap { margin-bottom: 1.25rem; }

    .success-ring {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(232,67,108,0.08);
      border: 2px solid rgba(232,67,108,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }

    .card-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
      margin: 0 0 8px;
      letter-spacing: -0.02em;
    }

    .card-sub {
      font-size: 15px;
      color: var(--mat-sys-on-surface-variant);
      margin: 0 0 2rem;
      line-height: 1.6;
    }

    .role-section { margin-bottom: 0; }

    .role-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 12px;
    }

    .role-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .role-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem 1rem 1.25rem;
      border-radius: 18px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-low);
      text-decoration: none;
      transition: border-color 0.2s, background 0.2s, transform 0.15s;
      position: relative;
      cursor: pointer;

      &:hover {
        border-color: var(--mat-sys-outline);
        background: var(--mat-sys-surface-container);
        transform: translateY(-2px);
      }
    }

    .role-avatar {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }

    .role-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      margin-bottom: 4px;
    }

    .role-desc {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
      text-align: center;
      line-height: 1.4;
    }

    .role-arrow {
      position: absolute;
      top: 12px;
      right: 14px;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      opacity: 0;
      transition: opacity 0.15s;
    }

    .role-card:hover .role-arrow { opacity: 1; }

    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--mat-sys-on-surface-variant);
      font-size: 13px;
      margin: 1.5rem 0 1rem;

      &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--mat-sys-outline-variant);
        opacity: 0.6;
      }
    }

    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 12px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: transparent;
      color: var(--mat-sys-on-surface-variant);
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;

      &:hover {
        background: var(--mat-sys-surface-container);
        color: var(--mat-sys-on-surface);
      }
    }
  `]
})
export class SignupSuccessComponent {}