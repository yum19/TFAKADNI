// src/app/pages/shop/_front/communaute/spaces/create-space-modal/create-space-modal.component.ts

import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SpaceService } from '../../../../../../core/services/space.service';
import { CreateSpaceRequest, SpaceCategory, SpaceAudience, CATEGORY_META } from '../../../../../../core/models/space.model';
import { ToastService } from '../../../../../../core/services/toast.service';

@Component({
  selector: 'app-create-space-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
<div class="csm-overlay" (click)="onOverlayClick($event)">
  <div class="csm-modal" (click)="$event.stopPropagation()">

    <!-- Header -->
    <div class="csm-header">
      <div class="csm-header-icon">🎙️</div>
      <div>
        <h2 class="csm-title">Create your Space</h2>
        <p class="csm-sub">Start a live audio conversation</p>
      </div>
      <button class="csm-close" (click)="close.emit()" type="button">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <div class="csm-body">

      <!-- Space name -->
      <div class="csm-field">
        <label class="csm-label">Space name</label>
        <input
          class="csm-input"
          [(ngModel)]="form.title"
          placeholder="What do you want to talk about?"
          maxlength="100"
        />
        <span class="csm-char-count">{{ form.title.length }}/100</span>
      </div>

      <!-- Category -->
      <div class="csm-field">
        <label class="csm-label">Category</label>
        <div class="csm-cat-grid">
          <button
            *ngFor="let cat of categories"
            class="csm-cat-btn"
            [class.active]="form.category === cat.key"
            (click)="form.category = cat.key"
            type="button">
            <span class="csm-cat-emoji">{{ cat.emoji }}</span>
            <span>{{ cat.label }}</span>
          </button>
        </div>
      </div>

      <!-- Audience -->
      <div class="csm-field">
        <label class="csm-label">Who can join?</label>
        <div class="csm-audience-row">
          <button
            class="csm-aud-btn"
            [class.active]="form.audience === 'EVERYONE'"
            (click)="form.audience = 'EVERYONE'"
            type="button">
            <mat-icon>public</mat-icon>
            <span>Everyone</span>
          </button>
          <button
            class="csm-aud-btn"
            [class.active]="form.audience === 'FOLLOWERS'"
            (click)="form.audience = 'FOLLOWERS'"
            type="button">
            <mat-icon>people</mat-icon>
            <span>My Followers</span>
          </button>
        </div>
      </div>

      <!-- Anonymous listeners -->
      <div class="csm-field csm-toggle-row">
        <div>
          <div class="csm-toggle-label">Anonymous listeners allowed</div>
          <div class="csm-toggle-sub">Non-logged-in users can listen</div>
        </div>
        <button
          class="csm-toggle-track"
          [class.on]="form.anonymousAllowed"
          (click)="form.anonymousAllowed = !form.anonymousAllowed"
          type="button">
          <span class="csm-toggle-thumb"></span>
        </button>
      </div>

      <!-- Max speakers -->
      <div class="csm-field">
        <label class="csm-label">Max speakers (excluding you)</label>
        <div class="csm-stepper">
          <button class="csm-step-btn" (click)="decSpeakers()" type="button">
            <mat-icon>remove</mat-icon>
          </button>
          <span class="csm-step-val">{{ form.maxSpeakers }}</span>
          <button class="csm-step-btn" (click)="incSpeakers()" type="button">
            <mat-icon>add</mat-icon>
          </button>
        </div>
      </div>

      <!-- Schedule -->
      <div class="csm-field">
        <div class="csm-toggle-row" style="margin-bottom: 10px">
          <div>
            <div class="csm-toggle-label">Schedule for later</div>
            <div class="csm-toggle-sub">Set a future start time</div>
          </div>
          <button
            class="csm-toggle-track"
            [class.on]="scheduled"
            (click)="scheduled = !scheduled"
            type="button">
            <span class="csm-toggle-thumb"></span>
          </button>
        </div>
        <div *ngIf="scheduled" class="csm-datetime-wrap">
          <input
            class="csm-input"
            type="datetime-local"
            [(ngModel)]="scheduledAtStr"
            [min]="minDateTime"
          />
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div class="csm-footer">
      <button class="csm-btn-cancel" (click)="close.emit()" type="button">Cancel</button>
      <button
        class="csm-btn-start"
        (click)="submit()"
        [disabled]="!form.title.trim() || !form.category || loading"
        type="button">
        <mat-icon>{{ scheduled ? 'schedule' : 'mic' }}</mat-icon>
        <span>{{ scheduled ? 'Schedule Space' : 'Start your Space' }}</span>
      </button>
    </div>

  </div>
</div>
  `,
  styles: [`
    .csm-overlay {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(10,5,8,0.72);
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(12px);
      animation: fadeIn .2s ease;
    }
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

    .csm-modal {
      width: 520px; max-width: calc(100vw - 32px);
      max-height: 90vh; overflow-y: auto;
      background: white; border-radius: 24px;
      box-shadow: 0 32px 80px rgba(255,79,117,.25);
      animation: slideUp .3s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes slideUp { from { opacity:0; transform: translateY(24px) } to { opacity:1; transform: translateY(0) } }

    .csm-header {
      display: flex; align-items: center; gap: 14px;
      padding: 24px 24px 18px;
      border-bottom: 1.5px solid #f0d0d9;
    }
    .csm-header-icon { font-size: 2rem; flex-shrink: 0; }
    .csm-title { font-size: 1.15rem; font-weight: 800; color: #1a0a10; margin: 0 0 2px; }
    .csm-sub { font-size: .78rem; color: #b08a9a; margin: 0; }
    .csm-close {
      margin-left: auto; background: #fff5f7; border: 1.5px solid #f0d0d9;
      border-radius: 50%; width: 36px; height: 36px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; color: #b08a9a;
      flex-shrink: 0; transition: all .2s;
    }
    .csm-close:hover { background: #ff4f75; color: white; border-color: #ff4f75; }
    .csm-close mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .csm-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }

    .csm-field { display: flex; flex-direction: column; gap: 8px; }

    .csm-label {
      font-size: .82rem; font-weight: 800; color: #1a0a10;
      text-transform: uppercase; letter-spacing: .4px;
    }

    .csm-input {
      width: 100%; border: 2px solid #f0d0d9; border-radius: 12px;
      padding: 11px 16px; font-size: .92rem; font-family: inherit;
      color: #1a0a10; background: #fff5f7; outline: none;
      transition: all .25s; box-sizing: border-box;
    }
    .csm-input:focus { border-color: #ff4f75; background: white; box-shadow: 0 0 0 4px rgba(255,79,117,.08); }

    .csm-char-count { font-size: .72rem; color: #b08a9a; text-align: right; }

    /* Category */
    .csm-cat-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 8px; }
    .csm-cat-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; border: 2px solid #f0d0d9; border-radius: 12px;
      background: #fff5f7; cursor: pointer; font-family: inherit;
      font-size: .84rem; font-weight: 600; color: #7a5060;
      transition: all .2s;
    }
    .csm-cat-btn:hover { border-color: #ff4f75; background: white; }
    .csm-cat-btn.active { border-color: #ff4f75; background: linear-gradient(135deg,#ff4f75,#ff6b8a); color: white; font-weight: 800; }
    .csm-cat-emoji { font-size: 1.1rem; }

    /* Audience */
    .csm-audience-row { display: flex; gap: 10px; }
    .csm-aud-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
      padding: 11px 16px; border: 2px solid #f0d0d9; border-radius: 12px;
      background: #fff5f7; cursor: pointer; font-family: inherit;
      font-size: .86rem; font-weight: 600; color: #7a5060; transition: all .2s;
    }
    .csm-aud-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .csm-aud-btn:hover { border-color: #ff4f75; }
    .csm-aud-btn.active { border-color: #ff4f75; background: #fff0f5; color: #ff4f75; font-weight: 800; }

    /* Toggle */
    .csm-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .csm-toggle-label { font-size: .88rem; font-weight: 700; color: #1a0a10; }
    .csm-toggle-sub { font-size: .74rem; color: #b08a9a; margin-top: 2px; }
    .csm-toggle-track {
      position: relative; width: 46px; height: 26px; border-radius: 13px;
      background: #e5e7eb; border: none; cursor: pointer; flex-shrink: 0;
      transition: background .3s; padding: 0;
    }
    .csm-toggle-track.on { background: #ff4f75; }
    .csm-toggle-thumb {
      position: absolute; top: 3px; left: 3px; width: 20px; height: 20px;
      border-radius: 50%; background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,.2);
      transition: transform .3s cubic-bezier(.4,0,.2,1);
    }
    .csm-toggle-track.on .csm-toggle-thumb { transform: translateX(20px); }

    /* Stepper */
    .csm-stepper { display: flex; align-items: center; gap: 16px; }
    .csm-step-btn {
      width: 38px; height: 38px; border-radius: 50%;
      border: 2px solid #f0d0d9; background: #fff5f7;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: #ff4f75; transition: all .2s;
    }
    .csm-step-btn:hover { background: #ff4f75; color: white; border-color: #ff4f75; }
    .csm-step-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .csm-step-val { font-size: 1.3rem; font-weight: 800; color: #1a0a10; min-width: 40px; text-align: center; }

    /* Datetime */
    .csm-datetime-wrap { margin-top: 4px; }

    /* Footer */
    .csm-footer {
      display: flex; align-items: center; gap: 10px;
      padding: 18px 24px;
      border-top: 1.5px solid #f0d0d9;
    }
    .csm-btn-cancel {
      flex: 0 0 auto; padding: 11px 22px; border-radius: 30px;
      border: 1.5px solid #f0d0d9; background: transparent;
      font-family: inherit; font-size: .88rem; font-weight: 700;
      color: #7a5060; cursor: pointer; transition: all .2s;
    }
    .csm-btn-cancel:hover { border-color: #ff4f75; color: #ff4f75; }

    .csm-btn-start {
      flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 7px;
      padding: 12px 24px; border-radius: 30px;
      background: linear-gradient(135deg,#ff4f75,#ff6b8a);
      border: none; color: white; font-family: inherit;
      font-size: .92rem; font-weight: 800; cursor: pointer;
      box-shadow: 0 6px 20px rgba(255,79,117,.3);
      transition: all .25s;
    }
    .csm-btn-start:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(255,79,117,.4); }
    .csm-btn-start:disabled { opacity: .5; cursor: not-allowed; transform: none; }
    .csm-btn-start mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `]
})
export class CreateSpaceModalComponent implements OnInit {
  @Output() close   = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  loading = false;
  scheduled = false;
  scheduledAtStr = '';

  form: CreateSpaceRequest = {
    title:            '',
    category:         'GROSSESSE',
    audience:         'EVERYONE',
    anonymousAllowed: true,
    maxSpeakers:      10,
    scheduledAt:      null,
  };

  categories = Object.entries(CATEGORY_META).map(([key, v]) => ({
    key: key as SpaceCategory,
    ...v
  }));

  get minDateTime(): string {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 1);
    return d.toISOString().slice(0, 16);
  }

  constructor(private spaceSvc: SpaceService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.scheduledAtStr = this.minDateTime;
  }

  incSpeakers(): void { if (this.form.maxSpeakers < 20) this.form.maxSpeakers++; }
  decSpeakers(): void { if (this.form.maxSpeakers > 1)  this.form.maxSpeakers--; }

  onOverlayClick(e: Event): void { this.close.emit(); }

  submit(): void {
  if (!this.form.title.trim() || !this.form.category) return;
  this.loading = true;

  this.form.scheduledAt = this.scheduled ? this.scheduledAtStr : null;

  this.spaceSvc.createSpace(this.form).subscribe({
    next: (space) => {
      this.loading = false;
      this.created.emit();
      this.close.emit();
      if (space.status === 'LIVE') {
        window.dispatchEvent(new CustomEvent('open-space-room', { detail: space }));
      }
    },
    error: (err) => {
      this.loading = false;
      console.error('Create space failed:', err);
this.toast.error('Failed to create space. Check backend endpoint (404 error).');
    }
  });
}
}