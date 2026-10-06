import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Pregnancy, PrenatalExam } from '../../../../core/models/pregnancy.model';
import { PrenatalExamService } from '../../../../core/services/prenatal-exam.service';
import { PregnancyService } from '../../../../core/services/pregnancy.service';
import { ExamBadgeService } from '../../../../core/services/exam-badge.service';

@Component({
  selector: 'app-femme-exams',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDividerModule, MatCheckboxModule,
    ReactiveFormsModule, MatDatepickerModule, MatNativeDateModule,
  ],
  templateUrl: './exams.html',
  styleUrl: './exams.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ExamsComponent implements OnInit {

  allExams: PrenatalExam[] = [];
  completedExams: PrenatalExam[] = [];
  pregnancies: Pregnancy[] = [];
  activePregnancyId: number = 0;
  currentWeek: number = 0;
  currentTrimester: number = 1;
  loading = true;
  totalExams = 0;
  totalCompleted = 0;
  totalPending = 0;
  isSharedPartner = false;
  hasActivePregnancy = false;
  showDeleteExamConfirm = false;
examToDelete: PrenatalExam | null = null;
showCannotDeleteExam = false;
  recommendedCurrent: PrenatalExam[] = [];
  customT1: PrenatalExam[] = [];
  customT2: PrenatalExam[] = [];
  customT3: PrenatalExam[] = [];
  alertTriggeredExams: PrenatalExam[] = [];

  showForm = false;
  showNoPregnancyAlert = false;
  showHistoryPopup = false;
  historyFilter: 'ALL' | 'MANDATORY' | 'CUSTOM' | 'ALERT' = 'ALL';
  saving = false;

  private isAlertTriggeredExam(exam: PrenatalExam): boolean {
    return !!exam.vital || !!exam.alertSeverity;
  }

  get filteredCompletedExams(): PrenatalExam[] {
    switch (this.historyFilter) {
      case 'MANDATORY': return this.completedExams.filter(e =>
        e.examType === 'MANDATORY' || e.examType === 'OPTIONAL');
      case 'CUSTOM': return this.completedExams.filter(e =>
        e.examType === 'CUSTOM' && !this.isAlertTriggeredExam(e));
      case 'ALERT': return this.completedExams.filter(e => this.isAlertTriggeredExam(e));
      default: return this.completedExams;
    }
  }

  get countByFilter(): { mandatory: number; custom: number; alert: number } {
    return {
      mandatory: this.completedExams.filter(e =>
        e.examType === 'MANDATORY' || e.examType === 'OPTIONAL').length,
      custom: this.completedExams.filter(e =>
        e.examType === 'CUSTOM' && !this.isAlertTriggeredExam(e)).length,
      alert: this.completedExams.filter(e => this.isAlertTriggeredExam(e)).length,
    };
  }

  examForm: FormGroup;
  showDoneForm = false;
  selectedExam: PrenatalExam | null = null;
  doneForm: FormGroup;
  showEditForm = false;
  editForm: FormGroup;

  constructor(
    private examService: PrenatalExamService,
    private pregnancyService: PregnancyService,
    private examBadge: ExamBadgeService,
    private fb: FormBuilder
  ) {
    this.examForm = this.fb.group({
      examName:        ['', Validators.required],
      examType:        ['CUSTOM', Validators.required],
      recommendedWeek: [null, [Validators.required, Validators.min(1), Validators.max(40)]],
      resultNotes:     [''],
    });
    this.doneForm = this.fb.group({
      doneDate:    [new Date(), Validators.required],
      resultNotes: [''],
      documentUrl: [''],
    });
    this.editForm = this.fb.group({
      examName:        ['', Validators.required],
      examType:        ['CUSTOM', Validators.required],
      recommendedWeek: [null, [Validators.required, Validators.min(1), Validators.max(40)]],
      resultNotes:     [''],
      documentUrl:     [''],
    });
  }

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading = true;
    this.pregnancyService.getMyPregnancies().subscribe({
      next: (list) => {
        this.pregnancies = list;
        const active = list.find(p => p.status === 'ACTIVE') || list[list.length - 1];
        this.hasActivePregnancy = !!list.find(p => p.status === 'ACTIVE');
        this.activePregnancyId = active?.id || 0;
        this.isSharedPartner = active?.isSharedPartner || false;
        this.currentWeek = active?.lmpDate ? this.examBadge.getCurrentWeek(active.lmpDate) : 0;
        this.currentTrimester = this.currentWeek <= 12 ? 1 : this.currentWeek <= 26 ? 2 : 3;
        this.loadAllExams(list);
      },
      error: () => { this.loading = false; }
    });
  }

  loadAllExams(pregnancies: Pregnancy[]) {
    if (pregnancies.length === 0) { this.loading = false; return; }
    let allExams: PrenatalExam[] = [];
    let completed = 0;

    pregnancies.forEach(p => {
      this.examService.getExamsByPregnancy(p.id).subscribe({
        next: (exams) => {
          allExams = [...allExams, ...exams];
          completed++;
          if (completed === pregnancies.length) {
            this.allExams = allExams;

            const pending = allExams
              .filter(e => !e.done)
              .sort((a, b) => (a.recommendedWeek || 0) - (b.recommendedWeek || 0));

            const isAlertTriggered = (exam: PrenatalExam) => !!exam.vital || !!exam.alertSeverity;

            // ── Card 1 : Recommended ──
            const trimStart = this.currentTrimester === 1 ? 1 : this.currentTrimester === 2 ? 13 : 27;
            const trimEnd   = this.currentTrimester === 1 ? 12 : this.currentTrimester === 2 ? 26 : 40;
            this.recommendedCurrent = pending.filter(e =>
              (e.examType === 'MANDATORY' || e.examType === 'OPTIONAL') &&
              !isAlertTriggered(e) &&
              (e.recommendedWeek || 0) >= trimStart &&
              (e.recommendedWeek || 0) <= trimEnd
            );

            // ── Card 2 : Custom personal ──
            const custom = pending.filter(e => e.examType === 'CUSTOM' && !isAlertTriggered(e));
            this.customT1 = custom.filter(e => (e.recommendedWeek || 0) <= 12);
            this.customT2 = custom.filter(e => (e.recommendedWeek || 0) >= 13 && (e.recommendedWeek || 0) <= 26);
            this.customT3 = custom.filter(e => (e.recommendedWeek || 0) >= 27);

            // ── Card 4 : Alert-triggered ──
            this.alertTriggeredExams = pending
              .filter(isAlertTriggered)
              .sort((a, b) => this.severityOrder(b.alertSeverity) - this.severityOrder(a.alertSeverity));

            // ── History ──
            this.completedExams = allExams
              .filter(e => e.done)
              .sort((a, b) => (b.recommendedWeek || 0) - (a.recommendedWeek || 0));

            this.totalExams     = allExams.length;
            this.totalCompleted = this.completedExams.length;
            this.totalPending   = pending.length;

            // ── Badge navbar = exams dus cette semaine + TOUS les alert-triggered ──
            const dueThisWeek = pending.filter(e =>
              e.recommendedWeek !== null &&
              e.recommendedWeek === this.currentWeek &&
              !isAlertTriggered(e)  // exclure les alert-triggered déjà comptés séparément
            ).length;
            this.examBadge.set(dueThisWeek + this.alertTriggeredExams.length);

            this.loading = false;
          }
        },
        error: () => {
          completed++;
          if (completed === pregnancies.length) this.loading = false;
        }
      });
    });
  }

  severityOrder(s: string | undefined): number {
    const m: any = { CRITICAL: 4, DANGER: 3, WARNING: 2, INFO: 1 };
    return m[s || ''] || 0;
  }

  getSeverityColor(s: string | undefined): string {
    const m: any = { CRITICAL: '#9c27b0', DANGER: '#f44336', WARNING: '#ff9800', INFO: '#03a9f4' };
    return m[s || ''] || '#999';
  }

  getSeverityIcon(s: string | undefined): string {
    const m: any = { CRITICAL: 'crisis_alert', DANGER: 'error', WARNING: 'warning', INFO: 'info' };
    return m[s || ''] || 'notifications';
  }

  isOverdue(exam: PrenatalExam): boolean {
    return !exam.done && exam.recommendedWeek === this.currentWeek;
  }
  isComingSoon(exam: PrenatalExam): boolean {
    const w = exam.recommendedWeek || 0;
    return !exam.done && w > this.currentWeek && w <= this.currentWeek + 2;
  }
  getTrimesterColor(trim: number): string {
    return ({ 1: '#c94d6a', 2: '#ff9800', 3: '#9c27b0' } as any)[trim] || '#999';
  }
  getTrimLabel(trim: number): string {
    return ({ 1: 'T1 · W1–W12', 2: 'T2 · W13–W26', 3: 'T3 · W27–W40' } as any)[trim] || '';
  }

  openForm() {
    if (!this.hasActivePregnancy) { this.showNoPregnancyAlert = true; return; }
    this.showForm = true;
  }
  closeForm() { this.showForm = false; this.examForm.reset({ examType: 'CUSTOM' }); }

  save() {
    if (this.examForm.invalid) return;
    this.saving = true;
    this.examService.createExam(this.activePregnancyId, this.examForm.value).subscribe({
      next: () => { this.saving = false; this.closeForm(); this.loadAll(); },
      error: () => { this.saving = false; }
    });
  }

  openDoneForm(exam: PrenatalExam, event?: Event) {
    event?.stopPropagation();
    this.selectedExam = exam;
    this.doneForm.reset({ doneDate: new Date(), resultNotes: '', documentUrl: '' });
    this.showDoneForm = true;
  }
  closeDoneForm() { this.showDoneForm = false; this.selectedExam = null; }

  markAsDone() {
    if (!this.selectedExam || this.doneForm.invalid) return;
    this.saving = true;
    const val = this.doneForm.value;
    const data = { ...val, doneDate: this.formatDate(val.doneDate), done: true };
    this.examService.markAsDone(this.selectedExam.id, data).subscribe({
      next: () => {
        this.saving = false;
        this.closeDoneForm();
        // Décrémenter si c'était un exam de la semaine ou un alert-triggered
        if (this.selectedExam?.recommendedWeek === this.currentWeek || !!this.selectedExam?.vital) {
          this.examBadge.decrement();
        }
        this.loadAll();
      },
      error: () => { this.saving = false; }
    });
  }

  openEditForm(exam: PrenatalExam, event?: Event) {
    event?.stopPropagation();
    this.selectedExam = exam;
    this.editForm.patchValue({
      examName: exam.examName, examType: exam.examType,
      recommendedWeek: exam.recommendedWeek,
      resultNotes: exam.resultNotes || '', documentUrl: exam.documentUrl || '',
    });
    this.showEditForm = true;
  }
  closeEditForm() { this.showEditForm = false; this.selectedExam = null; }

  saveEdit() {
    if (this.editForm.invalid || !this.selectedExam) return;
    this.saving = true;
    this.examService.updateExam(this.selectedExam.id, this.editForm.value).subscribe({
      next: () => { this.saving = false; this.closeEditForm(); this.loadAll(); },
      error: () => { this.saving = false; }
    });
  }

deleteExam(exam: PrenatalExam, event?: Event) {
  event?.stopPropagation();
  if (exam.examType !== 'CUSTOM') {
    this.showCannotDeleteExam = true;
    return;
  }
  this.examToDelete = exam;
  this.showDeleteExamConfirm = true;
}

confirmDeleteExam() {
  if (!this.examToDelete) return;
  this.showDeleteExamConfirm = false;
  this.examService.deleteExam(this.examToDelete.id).subscribe({
    next: () => {
      if (this.examToDelete!.vital) this.examBadge.decrement();
      this.examToDelete = null;
      this.loadAll();
    },
    error: () => { this.examToDelete = null; }
  });
}
  formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  }
  getTypeLabel(t: string): string {
    return ({ MANDATORY: 'Mandatory', OPTIONAL: 'Optional', CUSTOM: 'Custom' } as any)[t] || t;
  }
  getTypeColor(t: string): string {
    return ({ MANDATORY: '#f44336', OPTIONAL: '#03a9f4', CUSTOM: '#9c27b0' } as any)[t] || '#999';
  }
}