import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NotificationService, AppNotification } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-mother-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class MotherNotificationsComponent implements OnInit {
  private notificationService = inject(NotificationService);
  notifications: AppNotification[] = [];

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.notificationService.getAll().subscribe({
      next: data => this.notifications = data
    });
  }

  markRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => this.reload()
    });
  }
}