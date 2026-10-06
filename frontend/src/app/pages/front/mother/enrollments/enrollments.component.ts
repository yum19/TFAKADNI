import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LearningService } from '../../../../core/services/learning.service';
import { Enrollment } from '../../../../core/models/api.models';
import { NotifyService } from '../../../../core/services/notify.service';

@Component({
  selector: 'app-mother-enrollments',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './enrollments.component.html',
  styleUrls: ['./enrollments.component.scss']
})
export class MotherEnrollmentsComponent {
  private learning = inject(LearningService);
  private notify = inject(NotifyService);
  enrollments: Enrollment[] = [];

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.learning.getMyEnrollments().subscribe({ next: data => this.enrollments = data });
  }

  getAvgProgress(): number {
    if (!this.enrollments.length) return 0;
    return this.enrollments.reduce((sum, e) => sum + e.progressPct, 0) / this.enrollments.length;
  }

  bumpProgress(item: Enrollment, delta: number): void {
    const next = Math.max(0, Math.min(100, item.progressPct + delta));
    this.learning.updateProgress(item.courseId, next).subscribe({
      next: () => { this.notify.success('Progress updated.'); this.reload(); },
      error: () => this.notify.error('Progress update failed.')
    });
  }
}