import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PartnerService } from '../../../../core/services/partner.service';
import { NotifyService } from '../../../../core/services/notify.service';
import { PartnerLink, PartnerNote } from '../../../../core/models/api.models';

@Component({
  selector: 'app-mother-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss']
})
export class MotherNotesComponent implements OnInit {
  private partnerService = inject(PartnerService);
  private notify = inject(NotifyService);

  notes: PartnerNote[] = [];
  links: PartnerLink[] = [];
  selectedLink?: PartnerLink;
  draft = '';

  get unreadCount(): number {
    return this.notes.filter(n => !n.isRead).length;
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.partnerService.getInbox().subscribe({
      next: data => this.notes = data
    });
    this.partnerService.getMyMotherLinks().subscribe({
      next: data => {
        this.links = data.filter(link => link.status === 'ACCEPTED');
        this.selectedLink = this.links[0];
      }
    });
  }

  send(): void {
    if (!this.selectedLink || !this.draft.trim()) {
      this.notify.error('Choose an accepted link and write a note first.');
      return;
    }
    this.partnerService.createNote(
      this.selectedLink.partnerId,
      this.selectedLink.pregnancyId,
      this.draft.trim()
    ).subscribe({
      next: () => {
        this.notify.success('Note sent to partner ✨');
        this.draft = '';
        this.reload();
      },
      error: () => this.notify.error('Note could not be sent.')
    });
  }

  markRead(note: PartnerNote): void {
    this.partnerService.markNoteAsRead(note.id).subscribe({
      next: () => this.reload()
    });
  }

  remove(note: PartnerNote): void {
    this.partnerService.deleteNote(note.id).subscribe({
      next: () => {
        this.notify.success('Note removed.');
        this.reload();
      }
    });
  }
}