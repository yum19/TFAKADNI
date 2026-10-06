// src/app/components/post-notification-banner/post-notification-banner.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PostNotificationService } from '../../../../../core/services/post-notification.service';
import { PostNotification } from '../../../../../core/models/report.model';
import { getEmailFromToken } from '../../../../../core/services/token.helper';

@Component({
  selector: 'app-post-notification-banner',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="pnb-wrap" *ngIf="visible.length > 0">
      <div
        class="pnb-item"
        *ngFor="let n of visible"
        [class.pnb-deleted]="n.type === 'POST_DELETED'"
        [class.pnb-warned]="n.type === 'POST_REPORTED'">
        <mat-icon class="pnb-icon">{{ n.type === 'POST_DELETED' ? 'delete_forever' : 'warning' }}</mat-icon>
        <span class="pnb-msg">{{ n.message }}</span>
        <button class="pnb-dismiss" (click)="dismiss(n)">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .pnb-wrap {
      position: fixed; top: 80px; right: 20px; z-index: 9000;
      display: flex; flex-direction: column; gap: 10px;
      max-width: 380px;
    }
    .pnb-item {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 16px; border-radius: 14px;
      box-shadow: 0 8px 28px rgba(0,0,0,0.14);
      animation: pnbSlide 0.35s cubic-bezier(0.22,1,0.36,1) both;
      font-family: 'DM Sans', 'Nunito', sans-serif;
    }
    @keyframes pnbSlide {
      from { opacity: 0; transform: translateX(40px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .pnb-warned {
      background: #fffbeb; border: 1.5px solid #fde68a; color: #92400e;
    }
    .pnb-deleted {
      background: #fff1f2; border: 1.5px solid #fecdd3; color: #9f1239;
    }
    .pnb-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; margin-top: 1px; }
    .pnb-msg { flex: 1; font-size: 0.87rem; font-weight: 600; line-height: 1.5; }
    .pnb-dismiss {
      background: transparent; border: none; cursor: pointer;
      color: inherit; opacity: 0.6; width: 24px; height: 24px;
      border-radius: 50%; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0; transition: opacity 0.2s;
      padding: 0;
    }
    .pnb-dismiss:hover { opacity: 1; }
    .pnb-dismiss mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `]
})
export class PostNotificationBannerComponent implements OnInit, OnDestroy {

  visible: PostNotification[] = [];
  private autoHideTimers = new Map<string, any>();

  constructor(public postNotifService: PostNotificationService) {}

  ngOnInit(): void {
    // Connect WebSocket
    const email = getEmailFromToken();
    if (email) this.postNotifService.connect(email);

    // React to new notifications
    // Use effect-like polling via interval (Angular signals don't have effect in all versions)
    const poll = setInterval(() => {
      const all = this.postNotifService.notifications();
      const unread = all.filter(n => !n.readAt);
      // Add new ones to visible
      for (const n of unread) {
        if (n.id && !this.visible.find(v => v.id === n.id)) {
          this.visible.push(n);
          // Auto-dismiss after 8s
          this.autoHideTimers.set(n.id!, setTimeout(() => this.dismiss(n), 8000));
        }
      }
    }, 300);

    (this as any)._poll = poll;
  }

  ngOnDestroy(): void {
    clearInterval((this as any)._poll);
    this.autoHideTimers.forEach(t => clearTimeout(t));
  }

  dismiss(n: PostNotification): void {
    this.visible = this.visible.filter(v => v.id !== n.id);
    if (n.id) {
      clearTimeout(this.autoHideTimers.get(n.id));
      this.autoHideTimers.delete(n.id);
    }
    // Mark read in service
    this.postNotifService.notifications.update(list =>
      list.map(x => x.id === n.id ? { ...x, readAt: new Date() } : x)
    );
  }
}