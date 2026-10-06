import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PartnerService } from '../../../../core/services/partner.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { PartnerLink } from '../../../../core/models/api.models';
import { PartnerPermissionService } from '../../../../core/services/partner-permission.service';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-partner-invites',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIcon],
  templateUrl: './invites.component.html',
  styleUrls: ['./invites.component.scss']
})
export class PartnerInvitesComponent implements OnInit {
  private partner = inject(PartnerService);
  private notify = inject(NotifyService);
  permissionService = inject(PartnerPermissionService);
  invites: PartnerLink[] = [];

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.partner.getMyPartnerInvites().subscribe({
      next: data => this.invites = data
    });
  }

  accept(id: number): void {
    this.partner.acceptInvite(id).subscribe({
      next: () => {
        this.notify.success('Collaboration accepted. You are now linked.');
        this.reload();
      },
      error: () => this.notify.error('Accept failed. Please try again.')
    });
  }

  reject(id: number): void {
    this.partner.rejectInvite(id).subscribe({
      next: () => {
        this.notify.info('Invitation declined.');
        this.reload();
      },
      error: () => this.notify.error('Reject failed.')
    });
  }
}
