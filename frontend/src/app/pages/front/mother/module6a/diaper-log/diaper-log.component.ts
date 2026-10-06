import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  DiaperLogRequestDTO,
  DiaperLogResponseDTO,
  DiaperLogService,
  DiaperType
} from '../../../../../core/services/module6a/diaper-log.service';

@Component({
  selector: 'app-diaper-log',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './diaper-log.component.html',
  styleUrls: ['./diaper-log.component.css']
})
export class DiaperLogComponent implements OnInit {
  babyId!: number;

  @ViewChild('formCard') private readonly formCard?: ElementRef<HTMLElement>;

  diaperLogs: DiaperLogResponseDTO[] = [];
  loading = false;
  submitting = false;
  showTodayOnly = false;
  isEditMode = false;
  selectedLogId: number | null = null;
  errorMessage = '';
  successMessage = '';

  diaperTypes: DiaperType[] = ['WET', 'DIRTY', 'MIXED'];

  diaperForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private diaperLogService: DiaperLogService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();

    const babyIdParam = this.route.snapshot.paramMap.get('babyId');
    this.babyId = babyIdParam ? +babyIdParam : 1;

    this.loadLogs();
  }

  backToProfilesUrl(): string {
    return '/mother/baby-profiles';
  }

  scrollToForm(): void {
    this.formCard?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  initForm(): void {
    this.diaperForm = this.fb.group({
      changeTime: ['', Validators.required],
      diaperType: ['', Validators.required],
      color: [''],
      consistency: [''],
      notes: ['']
    });
  }

  loadLogs(): void {
    this.loading = true;
    this.errorMessage = '';

    const request$ = this.showTodayOnly
      ? this.diaperLogService.getTodayDiaperLogs(this.babyId)
      : this.diaperLogService.getAllDiaperLogsByBaby(this.babyId);

    request$.subscribe({
      next: (data) => {
        this.diaperLogs = data;
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Erreur lors du chargement des diaper logs.';
        this.loading = false;
      }
    });
  }

  toggleTodayFilter(): void {
    this.showTodayOnly = !this.showTodayOnly;
    this.loadLogs();
  }

  onSubmit(): void {
    if (this.diaperForm.invalid) {
      this.diaperForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: DiaperLogRequestDTO = {
      changeTime: this.formatToLocalDateTime(this.diaperForm.value.changeTime),
      diaperType: this.diaperForm.value.diaperType,
      color: this.diaperForm.value.color?.trim() || null,
      consistency: this.diaperForm.value.consistency?.trim() || null,
      notes: this.diaperForm.value.notes?.trim() || null
    };

    if (this.isEditMode && this.selectedLogId !== null) {
      this.diaperLogService.updateDiaperLog(this.babyId, this.selectedLogId, payload).subscribe({
        next: () => {
          this.successMessage = 'Diaper log modifié avec succès.';
          this.resetForm();
          this.loadLogs();
          this.submitting = false;
        },
        error: (error) => {
          console.error(error);
          this.errorMessage = 'Erreur lors de la modification.';
          this.submitting = false;
        }
      });
    } else {
      this.diaperLogService.createDiaperLog(this.babyId, payload).subscribe({
        next: () => {
          this.successMessage = 'Diaper log ajouté avec succès.';
          this.resetForm();
          this.loadLogs();
          this.submitting = false;
        },
        error: (error) => {
          console.error(error);
          this.errorMessage = 'Erreur lors de l’ajout.';
          this.submitting = false;
        }
      });
    }
  }

  editLog(log: DiaperLogResponseDTO): void {
    this.isEditMode = true;
    this.selectedLogId = log.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.diaperForm.patchValue({
      changeTime: this.toDateTimeLocalValue(log.changeTime),
      diaperType: log.diaperType,
      color: log.color || '',
      consistency: log.consistency || '',
      notes: log.notes || ''
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteLog(logId: number): void {
    const confirmed = window.confirm('Voulez-vous vraiment supprimer ce diaper log ?');
    if (!confirmed) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.diaperLogService.deleteDiaperLog(this.babyId, logId).subscribe({
      next: () => {
        this.successMessage = 'Diaper log supprimé avec succès.';
        this.loadLogs();
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Erreur lors de la suppression.';
      }
    });
  }

  resetForm(): void {
    this.isEditMode = false;
    this.selectedLogId = null;
    this.diaperForm.reset();
  }

  getTypeClass(type: DiaperType): string {
    switch (type) {
      case 'WET':
        return 'tag wet';
      case 'DIRTY':
        return 'tag dirty';
      case 'MIXED':
        return 'tag mixed';
      default:
        return 'tag';
    }
  }

  private formatToLocalDateTime(value: string): string {
    return value;
  }

  private toDateTimeLocalValue(dateString: string): string {
    return dateString?.slice(0, 16);
  }

  trackByLogId(index: number, log: DiaperLogResponseDTO): number {
    return log.id;
  }
}