import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AdminService } from '../../../core/services/admin.service';
import { NotifyService } from '../../../core/services/notify.service';
import { PartnerGuide } from '../../../core/models/api.models';

@Component({
  selector: 'app-admin-guides',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './guides.component.html',
  styleUrls: ['./guides.component.scss']
})
export class AdminGuidesComponent implements OnInit {
  private admin = inject(AdminService);
  private notify = inject(NotifyService);

  guides: PartnerGuide[] = [];
  editingGuide: any = null;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.admin.getGuides().subscribe({ next: (data) => this.guides = data });
  }

  startEditGuide(guide: PartnerGuide) {
    this.editingGuide = { ...guide };
  }

  saveGuide() {
    this.admin.updateGuide(this.editingGuide.id, this.editingGuide).subscribe({
      next: () => {
        this.notify.success('Guide updated successfully.');
        this.editingGuide = null;
        this.loadData();
      },
      error: () => this.notify.error('Update failed.')
    });
  }

  deleteGuide(id: number) {
    if (confirm('Are you sure you want to delete this Partner Guide?')) {
      this.admin.deleteGuide(id).subscribe({
        next: () => {
          this.notify.success('Guide deleted.');
          this.loadData();
        },
        error: () => this.notify.error('Failed to delete guide.')
      });
    }
  }
}