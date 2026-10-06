import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PartnerService } from '../../../../core/services/partner.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { PartnerLink, PartnerNote } from '../../../../core/models/api.models';
import { PartnerPermissionService } from '../../../../core/services/partner-permission.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-partner-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss']
})
export class PartnerNotesComponent implements OnInit {
  private partnerService = inject(PartnerService);
  private notify = inject(NotifyService);
  permissionService = inject(PartnerPermissionService);

  notes: PartnerNote[] = [];
  links: PartnerLink[] = [];
  selectedLink?: PartnerLink;
  draft = '';

  ngOnInit(): void {
    this.reload();
  }

  get unreadCount(): number {
    return this.notes.filter(n => !n.isRead).length;
  }

  reload(): void {
    this.partnerService.getInbox().subscribe({
      next: data => this.notes = data
    });

    this.partnerService.getMyPartnerInvites().subscribe({
      next: data => {
        this.links = this.permissionService.filterAcceptedLinksWithPermission(data, 'ADD_PARTNER_NOTE');
        this.selectedLink = this.links.length > 0 ? this.links[0] : undefined;
      }
    });
  }

  send(): void {
    if (!this.selectedLink) {
      this.notify.error('No accepted link currently allows partner notes.');
      return;
    }

    if (!this.draft.trim()) {
      this.notify.error('Write your response first.');
      return;
    }

    this.partnerService.createNote(
      this.selectedLink.motherId,
      this.selectedLink.pregnancyId,
      this.draft.trim()
    ).subscribe({
      next: () => {
        this.notify.success('Response sent ✨');
        this.draft = '';
        this.reload();
      },
      error: () => this.notify.error('Failed to send note.')
    });
  }

  markRead(note: PartnerNote): void {
    this.partnerService.markNoteAsRead(note.id).subscribe({
      next: () => this.reload()
    });
  }
}
