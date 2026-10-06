// src/app/components/confirm-modal/confirm-modal.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (toast.confirmDialog()) {
      <div class="cm-overlay" (click)="onOverlayClick()">
        <div class="cm-modal" (click)="$event.stopPropagation()">

          <!-- Icon: warning for confirm, info for alert -->
          <div class="cm-icon" [class.cm-icon--alert]="toast.confirmDialog()!.type === 'alert'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          <p class="cm-message">{{ toast.confirmDialog()!.message }}</p>

          <!-- ALERT: single OK button -->
          @if (toast.confirmDialog()!.type === 'alert') {
            <div class="cm-actions cm-actions--center">
              <button class="cm-btn cm-ok" (click)="resolve(true)">OK</button>
            </div>
          }

          <!-- CONFIRM: Cancel + Confirm buttons -->
          @if (toast.confirmDialog()!.type === 'confirm') {
            <div class="cm-actions">
              <button class="cm-btn cm-cancel" (click)="resolve(false)">Cancel</button>
              <button class="cm-btn cm-confirm" (click)="resolve(true)">Confirm</button>
            </div>
          }

        </div>
      </div>
    }
  `,
  styles: [`
    .cm-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(26, 10, 16, 0.55);
      backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      animation: cmFadeIn 0.2s ease;
    }
    @keyframes cmFadeIn { from { opacity: 0; } to { opacity: 1; } }

    .cm-modal {
      background: #fff;
      border-radius: 22px;
      border: 1.5px solid rgba(255, 192, 210, 0.6);
      box-shadow: 0 24px 64px rgba(255, 79, 117, 0.22), 0 4px 16px rgba(0,0,0,0.08);
      padding: 36px 32px 28px;
      width: 100%;
      max-width: 380px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      animation: cmSlideUp 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    }
    @keyframes cmSlideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0)    scale(1);    }
    }

    .cm-icon {
      width: 52px; height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #fff0f3, #ffe4ea);
      border: 2px solid rgba(255, 79, 117, 0.3);
      display: flex; align-items: center; justify-content: center;
      color: #ff4f75;
      flex-shrink: 0;
    }

    /* Alert variant — purple/info tint */
    .cm-icon--alert {
      background: linear-gradient(135deg, #f5f3ff, #ede9fe);
      border-color: rgba(108, 92, 231, 0.3);
      color: #6c5ce7;
    }

    .cm-icon svg { width: 26px; height: 26px; }

    .cm-message {
      font-family: 'DM Sans', 'Nunito', 'Segoe UI', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      color: #1a0a10;
      text-align: center;
      line-height: 1.55;
      margin: 0;
    }

    .cm-actions {
      display: flex;
      gap: 10px;
      width: 100%;
      margin-top: 4px;
    }

    .cm-actions--center {
      justify-content: center;
    }

    .cm-btn {
      flex: 1;
      padding: 12px 0;
      border-radius: 30px;
      font-size: 0.9rem;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .cm-ok {
      flex: 0 0 auto;
      min-width: 120px;
      background: linear-gradient(135deg, #6c5ce7, #a29bfe);
      color: white;
      box-shadow: 0 4px 16px rgba(108, 92, 231, 0.35);
    }
    .cm-ok:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(108, 92, 231, 0.45);
    }

    .cm-cancel {
      background: #f9f0f3;
      color: #7a5060;
      border: 1.5px solid #f0d0d9;
    }
    .cm-cancel:hover {
      background: #f0d0d9;
      color: #3d1a26;
    }

    .cm-confirm {
      background: linear-gradient(135deg, #ff4f75, #ff6b8a);
      color: white;
      box-shadow: 0 4px 16px rgba(255, 79, 117, 0.35);
    }
    .cm-confirm:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(255, 79, 117, 0.45);
    }
  `]
})
export class ConfirmModalComponent {
  toast = inject(ToastService);

  resolve(confirmed: boolean): void {
    this.toast.resolveConfirm(confirmed);
  }

  // Clicking overlay closes alert freely, but not confirm (accidental dismiss)
  onOverlayClick(): void {
    if (this.toast.confirmDialog()?.type === 'alert') {
      this.resolve(true);
    }
  }
}