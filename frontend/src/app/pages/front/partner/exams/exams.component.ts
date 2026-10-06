import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { PrenatalExam } from '../../../../core/models/pregnancy.model';
import { PregnancyService } from '../../../../core/services/pregnancy.service';
import { PrenatalExamService } from '../../../../core/services/prenatal-exam.service';

@Component({
  selector: 'app-partner-exams',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressBarModule, MatDividerModule],
  templateUrl: './exams.html',
  styleUrl: './exams.scss'
})
export class PartnerExamsComponent implements OnInit {
  pendingExams: PrenatalExam[] = [];
  completedExams: PrenatalExam[] = [];
  loading = true;
  accessDenied = false;

  constructor(
    private pregnancyService: PregnancyService,
    private examService: PrenatalExamService,
  ) {}

  ngOnInit() {
    this.pregnancyService.getActiveForPartner().subscribe({
      next: (p) => {
        this.examService.getExamsByPregnancy(p.id).subscribe({
          next: (exams) => {
            this.pendingExams = exams.filter(e => !e.done);
            this.completedExams = exams.filter(e => e.done);
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 403) this.accessDenied = true;
      }
    });
  }

  getTypeLabel(t: string): string {
    const m: any = { MANDATORY: 'Mandatory', OPTIONAL: 'Optional', CUSTOM: 'Custom' };
    return m[t] || t;
  }

  getTypeColor(t: string): string {
    const m: any = { MANDATORY: '#f44336', OPTIONAL: '#03a9f4', CUSTOM: '#9c27b0' };
    return m[t] || '#999';
  }
}