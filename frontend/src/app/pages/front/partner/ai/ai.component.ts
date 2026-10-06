import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../../../core/services/ai.service';
import { PartnerService } from '../../../../core/services/partner.service';
import { PartnerGuide, PartnerLink } from '../../../../core/models/api.models';
import { NotifyService } from '../../../../core/services/notify.service';
import { PartnerPermissionService } from '../../../../core/services/partner-permission.service';

@Component({
  selector: 'app-partner-ai',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai.component.html',
  styleUrls: ['./ai.component.scss']
})
export class PartnerAiComponent implements OnInit {
  private ai = inject(AiService);
  private partner = inject(PartnerService);
  private notify = inject(NotifyService);
  permissionService = inject(PartnerPermissionService);

  guides: PartnerGuide[] = [];
  links: PartnerLink[] = [];
  guideId?: number;
  pregnancyId?: number;
  result = '';

  ngOnInit(): void {
    this.partner.getGuides().subscribe({
      next: data => this.guides = data
    });

    this.partner.getMyPartnerInvites().subscribe({
      next: data => {
        this.links = this.permissionService.filterAcceptedLinksWithPermission(data, 'VIEW_PREGNANCY');
        if (this.links.length > 0) {
          this.pregnancyId = this.links[0].pregnancyId;
        }
      }
    });
  }

  summarizeGuide(): void {
    if (!this.guideId) {
      this.notify.error('Please select a guide to analyze.');
      return;
    }
    this.result = '';
    this.ai.summarizeGuide(this.guideId).subscribe({
      next: r => this.result = r.result,
      error: () => this.notify.error('AI Summary failed.')
    });
  }

  tips(): void {
    if (!this.pregnancyId) {
      this.notify.error('You do not have pregnancy visibility on any accepted link.');
      return;
    }
    this.result = '';
    this.ai.generatePartnerTips(this.pregnancyId).subscribe({
      next: r => this.result = r.result,
      error: () => this.notify.error('Tips generation failed.')
    });
  }
}
