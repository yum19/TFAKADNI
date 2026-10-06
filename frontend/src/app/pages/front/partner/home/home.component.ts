import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PartnerService } from '../../../../core/services/partner.service';
import { SessionService } from '../../../../core/services/session.service';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-partner-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIcon],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class PartnerHomeComponent {
  private partner = inject(PartnerService);
  session = inject(SessionService);
  invites = 0;
  unread = 0;
  guides = 0;

  partnerPromises = [
    'Be specific when you offer help: “I can drive you”, “I can pick up the prescription”, “I can stay with you after the visit”.',
    'Do not use the collaboration space to monitor. Use it to support, reduce stress and communicate clearly.',
    'Read the guide, then ask one caring question instead of giving five instructions.'
  ];

  ngOnInit(): void {
    this.partner.getMyPartnerInvites().subscribe({ next: data => this.invites = data.length });
    this.partner.getUnreadNotificationsCount().subscribe({ next: data => this.unread = data });
    this.partner.getGuides().subscribe({ next: data => this.guides = data.length });
  }
}
