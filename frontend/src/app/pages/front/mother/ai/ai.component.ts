import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../../../core/services/ai.service';
import { PartnerService } from '../../../../core/services/partner.service';
import { LearningService } from '../../../../core/services/learning.service';
import { CourseModule, PartnerGuide } from '../../../../core/models/api.models';
import { NotifyService } from '../../../../core/services/notify.service';

@Component({
  selector: 'app-mother-ai',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai.component.html',
  styleUrls: ['./ai.component.scss']
})
export class MotherAiComponent {
  private ai = inject(AiService);
  private partner = inject(PartnerService);
  private learning = inject(LearningService);
  private notify = inject(NotifyService);

  guideId?: number;
  moduleId?: number;
  pregnancyId?: number;
  result = '';

  guides: PartnerGuide[] = [];
  modules: CourseModule[] = [];

  ngOnInit(): void {
    this.partner.getGuides().subscribe({ next: data => this.guides = data });
    this.partner.getPregnancyContext().subscribe({ next: ctx => this.pregnancyId = ctx.id ?? undefined });
    this.learning.getMyEnrollments().subscribe({
      next: data => {
        this.modules = [];
        const seen = new Set<number>();
        data.forEach(enrollment => {
          this.learning.getCourseModules(enrollment.courseId).subscribe({
            next: modules => {
              modules.forEach(module => {
                if (!seen.has(module.id)) {
                  seen.add(module.id);
                  this.modules.push(module);
                }
              });
            }
          });
        });
      }
    });
  }

  summarizeGuide(): void {
    if (!this.guideId) return this.notify.error('Select a guide first.');
    this.ai.summarizeGuide(this.guideId).subscribe({
      next: r => this.result = r.result,
      error: () => this.notify.error('Guide summary failed.')
    });
  }

  simplifyModule(): void {
    if (!this.moduleId) return this.notify.error('Select a module first.');
    this.ai.simplifyModule(this.moduleId).subscribe({
      next: r => this.result = r.result,
      error: () => this.notify.error('Simplify action failed.')
    });
  }

  generateTips(): void {
    if (!this.pregnancyId) return this.notify.error('Pregnancy context is required.');
    this.ai.generatePartnerTips(this.pregnancyId).subscribe({
      next: r => this.result = r.result,
      error: () => this.notify.error('Partner tips could not be generated.')
    });
  }

  copyResult(): void {
    if (!this.result) return;
    navigator.clipboard.writeText(this.result)
      .then(() => this.notify.error('Copied to clipboard!'))
      .catch(() => this.notify.error('Copy failed.'));
  }
}