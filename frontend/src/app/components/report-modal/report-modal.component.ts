// src/app/components/report-modal/report-modal.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ReportReason, ReportRequest, REPORT_REASON_LABELS } from '../../core/models/report.model';
import { ReportService } from '../../core/services/report.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="rm-overlay" (click)="onOverlayClick($event)">
      <div class="rm-modal" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="rm-header">
          <div class="rm-header-icon">🚩</div>
          <div>
            <h2 class="rm-title">Report Post</h2>
            <p class="rm-subtitle">Help us understand what's wrong</p>
          </div>
          <button class="rm-close" (click)="close.emit()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Reason list -->
        <div class="rm-reasons">
          <p class="rm-section-label">Why are you reporting this post?</p>
          <div class="rm-reason-grid">
            <button
              *ngFor="let r of reasons"
              class="rm-reason-btn"
              [class.selected]="selectedReason === r"
              (click)="selectedReason = r">
              <span class="rm-reason-label">{{ reasonLabels[r] }}</span>
              <mat-icon *ngIf="selectedReason === r" class="rm-check">check_circle</mat-icon>
            </button>
          </div>
        </div>

        <!-- Optional details -->
        <div class="rm-details-wrap" *ngIf="selectedReason">
          <p class="rm-section-label">Additional details <span class="rm-optional">(optional)</span></p>
          <textarea
            class="rm-details-input"
            [(ngModel)]="details"
            placeholder="Tell us more about the issue..."
            rows="3"
            maxlength="500">
          </textarea>
          <div class="rm-char-count">{{ details.length }}/500</div>
        </div>

        <!-- Anonymous notice -->
        <div class="rm-anon-notice">
          <mat-icon>visibility_off</mat-icon>
          <span>Your report is completely anonymous. The post author won't know who reported them.</span>
        </div>

        <!-- Actions -->
        <div class="rm-actions">
          <button class="rm-btn-cancel" (click)="close.emit()">Cancel</button>
          <button
            class="rm-btn-submit"
            [disabled]="!selectedReason || submitting"
            (click)="submit()">
            <mat-icon *ngIf="!submitting">flag</mat-icon>
            <span class="rm-spinner" *ngIf="submitting"></span>
            {{ submitting ? 'Reporting...' : 'Submit Report' }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .rm-overlay {
      position: fixed; inset: 0; z-index: 4000;
      background: rgba(10,5,8,0.65);
      display: flex; align-items: center; justify-content: center;
      animation: rmFadeIn 0.2s ease;
      backdrop-filter: blur(8px);
    }
    @keyframes rmFadeIn { from { opacity: 0; } to { opacity: 1; } }

    .rm-modal {
      width: 420px; max-width: calc(100vw - 32px);
      background: #fff; border-radius: 22px;
      box-shadow: 0 24px 64px rgba(255,79,117,0.18), 0 8px 32px rgba(0,0,0,0.12);
      animation: rmSlideUp 0.3s cubic-bezier(0.22,1,0.36,1) both;
      overflow: hidden;
    }
    @keyframes rmSlideUp {
      from { opacity: 0; transform: translateY(28px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .rm-header {
      display: flex; align-items: center; gap: 14px;
      padding: 22px 22px 16px;
      background: linear-gradient(135deg, #fff5f7, #fff);
      border-bottom: 1.5px solid #f0d0d9;
    }
    .rm-header-icon { font-size: 2rem; line-height: 1; }
    .rm-title { font-size: 1.1rem; font-weight: 800; color: #1a0a10; margin: 0 0 2px; }
    .rm-subtitle { font-size: 0.78rem; color: #b08a9a; margin: 0; }
    .rm-close {
      margin-left: auto; background: #fff0f5; border: 1.5px solid #f0d0d9;
      width: 34px; height: 34px; border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center; color: #b08a9a;
      transition: all 0.2s; flex-shrink: 0;
    }
    .rm-close:hover { background: #ff4f75; color: white; border-color: #ff4f75; }
    .rm-close mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .rm-section-label {
      font-size: 0.8rem; font-weight: 700; color: #7a5060;
      text-transform: uppercase; letter-spacing: 0.4px;
      margin: 0 0 10px;
    }
    .rm-optional { font-weight: 400; color: #b08a9a; text-transform: none; letter-spacing: 0; }

    .rm-reasons { padding: 18px 22px 0; }

    .rm-reason-grid { display: flex; flex-direction: column; gap: 7px; }

    .rm-reason-btn {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; padding: 11px 14px;
      border: 1.5px solid #f0d0d9; border-radius: 12px;
      background: #fff5f7; cursor: pointer; text-align: left;
      font-family: inherit; font-size: 0.9rem; font-weight: 600; color: #3d1a26;
      transition: all 0.18s;
    }
    .rm-reason-btn:hover { border-color: #ff4f75; background: #fff0f5; }
    .rm-reason-btn.selected {
      border-color: #ff4f75; background: linear-gradient(135deg, #fff0f5, #fff5f7);
      color: #ff4f75; font-weight: 700;
      box-shadow: 0 0 0 3px rgba(255,79,117,0.1);
    }
    .rm-check { font-size: 18px; width: 18px; height: 18px; color: #ff4f75; }

    .rm-details-wrap { padding: 16px 22px 0; }
    .rm-details-input {
      width: 100%; border: 1.5px solid #f0d0d9; border-radius: 12px;
      padding: 10px 14px; font-family: inherit; font-size: 0.88rem;
      color: #3d1a26; background: #fff5f7; outline: none; resize: none;
      transition: all 0.2s; line-height: 1.6;
    }
    .rm-details-input:focus {
      border-color: #ff4f75; background: white;
      box-shadow: 0 0 0 4px rgba(255,79,117,0.08);
    }
    .rm-char-count {
      text-align: right; font-size: 0.72rem; color: #b08a9a;
      margin-top: 4px; font-weight: 600;
    }

    .rm-anon-notice {
      display: flex; align-items: flex-start; gap: 10px;
      margin: 16px 22px 0; padding: 12px 14px;
      background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;
      font-size: 0.8rem; color: #166534; font-weight: 500; line-height: 1.5;
    }
    .rm-anon-notice mat-icon {
      font-size: 18px; width: 18px; height: 18px;
      color: #16a34a; flex-shrink: 0; margin-top: 1px;
    }

    .rm-actions {
      display: flex; gap: 10px; justify-content: flex-end;
      padding: 18px 22px;
    }
    .rm-btn-cancel {
      padding: 10px 22px; border-radius: 20px; border: 1.5px solid #f0d0d9;
      background: transparent; color: #7a5060; font-size: 0.88rem; font-weight: 700;
      font-family: inherit; cursor: pointer; transition: all 0.2s;
    }
    .rm-btn-cancel:hover { background: #fff5f7; border-color: #b08a9a; }
    .rm-btn-submit {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 22px; border-radius: 20px; border: none;
      background: linear-gradient(135deg, #ff4f75, #ff6b8a);
      color: white; font-size: 0.88rem; font-weight: 700;
      font-family: inherit; cursor: pointer;
      box-shadow: 0 4px 14px rgba(255,79,117,0.3);
      transition: all 0.2s;
    }
    .rm-btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255,79,117,0.4); }
    .rm-btn-submit:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
    .rm-btn-submit mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .rm-spinner {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: white;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ReportModalComponent {
  @Input()  postId!: number;
  @Output() close    = new EventEmitter<void>();
  @Output() reported = new EventEmitter<void>();

  readonly reasons      = Object.keys(REPORT_REASON_LABELS) as ReportReason[];
  readonly reasonLabels = REPORT_REASON_LABELS;

  selectedReason: ReportReason | null = null;
  details  = '';
  submitting = false;

  constructor(
    private reportService: ReportService,
    private toast: ToastService
  ) {}

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('rm-overlay')) {
      this.close.emit();
    }
  }

  submit(): void {
    if (!this.selectedReason || this.submitting) return;
    this.submitting = true;

    const req: ReportRequest = {
      postId: this.postId,
      reason: this.selectedReason,
      details: this.details.trim() || undefined,
    };

    this.reportService.report(req).subscribe({
      next: () => {
        this.submitting = false;
        this.toast.success('Report submitted. Thank you for keeping our community safe 🙏');
        this.reported.emit();
        this.close.emit();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.message ?? err?.message ?? '';
        if (msg.toLowerCase().includes('already')) {
          this.toast.error('You have already reported this post.');
        } else {
          this.toast.error('Could not submit report. Please try again.');
        }
      }
    });
  }
}