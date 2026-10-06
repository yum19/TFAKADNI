import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PartnerService } from '../../../../core/services/partner.service';
import { PartnerGuide } from '../../../../core/models/api.models';
import { AiService } from '../../../../core/services/ai.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-partner-guides',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './guides.component.html',
  styleUrls: ['./guides.component.scss']
})
export class PartnerGuidesComponent {
  private partner = inject(PartnerService);
  private ai = inject(AiService);
  guides: PartnerGuide[] = [];
  keyword = '';
  aiResult = '';
  selectedGuide?: PartnerGuide;
  isReading = false;

  ngOnInit(): void { this.reload(); }

  reload(): void {
    const action = this.keyword.trim() ? this.partner.searchGuides(this.keyword.trim()) : this.partner.getGuides();
    action.subscribe({ next: data => this.guides = data });
  }

  summarize(guide: PartnerGuide): void {
    this.selectedGuide = guide;
    this.ai.summarizeGuide(guide.id).subscribe({ next: r => this.aiResult = r.result });
  }

  openReader(guide: PartnerGuide): void {
    this.selectedGuide = guide;
    this.isReading = true;
    // Optional: Stop background scrolling
    document.body.style.overflow = 'hidden';
  }

  closeReader(): void {
    this.isReading = false;
    document.body.style.overflow = 'auto';
  }
}
