import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService, AppNotification } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      @for (notification of notifications; track notification.id) {
        <div class="notification-popup" [class.exiting]="notification._exiting">
          <div class="notification-content">
            <h4>{{ notification.title }}</h4>
            <p>{{ notification.message }}</p>
            @if (notification.count) {
              <span class="count">{{ notification.count }}</span>
            }
          </div>
          <button class="dismiss-btn" (click)="dismiss(notification.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .notification-popup {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 16px;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .notification-popup.exiting {
      animation: slideOut 0.3s ease-in forwards;
    }
    .notification-content h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
    }
    .notification-content p {
      margin: 0;
      font-size: 14px;
      color: #666;
    }
    .count {
      display: inline-block;
      background: #007bff;
      color: white;
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 12px;
      margin-top: 8px;
    }
    .dismiss-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #999;
      padding: 0;
      margin-left: 8px;
    }
    .dismiss-btn:hover {
      color: #666;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `]
})
export class NotificationDisplayComponent implements OnInit, OnDestroy {
  notifications: AppNotification[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
  this.subscription = this.notificationService.notifications.subscribe({
    next: (notifications) => {
      console.log('Received notifications update', notifications);
      this.notifications = notifications;
    },
    error: (err) => {
      console.error('Failed to subscribe to notifications', err);
    }
  });
}

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  dismiss(id: string) {
    this.notificationService.dismiss(id);
  }
}