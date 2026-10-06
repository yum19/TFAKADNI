import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { PartnerService } from '../../../../core/services/partner.service';

@Component({
  selector: 'app-partner-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class PartnerNotificationsComponent implements OnInit {
  private partner = inject(PartnerService);
  notifications: any[] = [];

  ngOnInit(): void { 
    this.reload(); 
  }

  reload(): void {
    this.partner.getNotifications().subscribe({ 
      next: data => this.notifications = data 
    });
  }

  markRead(id: number): void {
    this.partner.markNotificationAsRead(id).subscribe({ 
      next: () => this.reload() 
    });
  }
}