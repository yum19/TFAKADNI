import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  VaccineRequestDTO,
  VaccineResponseDTO,
  VaccineService,
  VaccineStatus
} from '../../../../../core/services/module6a/vaccine.service';

type DisplayStatus = 'SCHEDULED' | 'DONE' | 'MISSED' | 'CANCELLED';
type StatusAction = 'DONE' | 'MISSED' | 'CANCELLED';

@Component({
  selector: 'app-vaccine',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vaccine.component.html',
  styleUrls: ['./vaccine.component.css']
})
export class VaccineComponent implements OnInit {
  babyId!: number;

  vaccines: VaccineResponseDTO[] = [];
  loading = false;
  submitting = false;

  isEditMode = false;
  selectedVaccineId: number | null = null;

  errorMessage = '';
  successMessage = '';

  vaccineForm!: FormGroup;

  searchTerm = '';
  currentPage = 1;
  pageSize = 6;
  pageSizeOptions = [4, 6, 8, 12];

  // Popup state
  showStatusModal = false;
  selectedStatusAction: StatusAction | null = null;
  modalTargetVaccine: VaccineResponseDTO | null = null;
  statusActionSubmitting = false;

  statusActionForm!: FormGroup;

  // Suggestion: liste prédéfinie de vaccins au lieu d’un texte libre
  vaccineOptions: string[] = [
    'BCG',
    'Hepatitis B',
    'Pentavalent',
    'Polio',
    'Pneumococcal',
    'Rotavirus',
    'MMR',
    'Varicella',
    'Influenza',
    'COVID-19'
  ];

  constructor(
    private fb: FormBuilder,
    private vaccineService: VaccineService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initMainForm();
    this.initStatusActionForm();

    const babyIdParam = this.route.snapshot.paramMap.get('babyId');
    this.babyId = babyIdParam ? +babyIdParam : 1;

    this.loadVaccines();
  }

  initMainForm(): void {
    this.vaccineForm = this.fb.group(
      {
        vaccineName: ['', [Validators.required, Validators.maxLength(100)]],
        scheduledDate: ['', Validators.required],
        reminderDate: [''],
        notes: ['', Validators.maxLength(500)]
      },
      { validators: this.createFormValidator() }
    );
  }

  initStatusActionForm(): void {
    this.statusActionForm = this.fb.group(
      {
        takenDate: [''],
        batchNumber: [''],
        administeredBy: [''],
        notes: ['']
      },
      { validators: this.statusActionValidator() }
    );
  }

  createFormValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const form = control as FormGroup;
      const scheduledDate = form.get('scheduledDate')?.value;
      const reminderDate = form.get('reminderDate')?.value;

      if (scheduledDate && reminderDate && reminderDate > scheduledDate) {
        return { reminderAfterScheduled: true };
      }

      return null;
    };
  }

  statusActionValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const form = control as FormGroup;

      if (this.selectedStatusAction !== 'DONE') {
        return null;
      }

      const takenDate = form.get('takenDate')?.value;
      const batchNumber = (form.get('batchNumber')?.value || '').trim();
      const administeredBy = (form.get('administeredBy')?.value || '').trim();
      const today = new Date().toISOString().split('T')[0];

      const errors: Record<string, boolean> = {};

      if (!takenDate) errors['takenDateRequired'] = true;
      if (!batchNumber) errors['batchNumberRequired'] = true;
      if (!administeredBy) errors['administeredByRequired'] = true;

      if (this.modalTargetVaccine?.scheduledDate && takenDate) {
        if (takenDate !== this.modalTargetVaccine.scheduledDate) {
          errors['takenDateMustEqualScheduled'] = true;
        }

        if (takenDate > today) {
          errors['takenDateInFuture'] = true;
        }
      }

      return Object.keys(errors).length ? errors : null;
    };
  }

  loadVaccines(): void {
    this.loading = true;
    this.errorMessage = '';

    this.vaccineService.getAllVaccinesByBaby(this.babyId).subscribe({
      next: (data) => {
        this.vaccines = [...data].sort(
          (a, b) =>
            new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
        );
        this.currentPage = 1;
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = this.extractErrorMessage(error, 'Error loading vaccines.');
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.vaccineForm.invalid) {
      this.vaccineForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    // À la création ou mise à jour depuis le formulaire principal:
    // status automatique = SCHEDULED
    const payload: VaccineRequestDTO = {
      vaccineName: this.trimOrEmpty(this.vaccineForm.value.vaccineName),
      scheduledDate: this.vaccineForm.value.scheduledDate,
      status: 'SCHEDULED',
      reminderDate: this.undefinedIfEmpty(this.vaccineForm.value.reminderDate),
      notes: this.undefinedIfBlank(this.vaccineForm.value.notes)
    };

    const request$ =
      this.isEditMode && this.selectedVaccineId !== null
        ? this.vaccineService.updateVaccine(this.babyId, this.selectedVaccineId, payload)
        : this.vaccineService.createVaccine(this.babyId, payload);

    request$.subscribe({
      next: () => {
        this.successMessage = this.isEditMode
          ? 'Vaccine updated successfully.'
          : 'Vaccine added successfully.';
        this.resetForm();
        this.loadVaccines();
        this.submitting = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = this.extractErrorMessage(
          error,
          this.isEditMode ? 'Error updating vaccine.' : 'Error adding vaccine.'
        );
        this.submitting = false;
      }
    });
  }

  editVaccine(vaccine: VaccineResponseDTO): void {
    this.isEditMode = true;
    this.selectedVaccineId = vaccine.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.vaccineForm.patchValue({
      vaccineName: vaccine.vaccineName,
      scheduledDate: vaccine.scheduledDate,
      reminderDate: vaccine.reminderDate || '',
      notes: vaccine.notes || ''
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openAddModal(): void {
    this.resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteVaccine(vaccineId: number): void {
    const confirmed = window.confirm('Are you sure you want to delete this vaccine record?');
    if (!confirmed) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.vaccineService.deleteVaccine(this.babyId, vaccineId).subscribe({
      next: () => {
        this.successMessage = 'Vaccine deleted successfully.';
        this.loadVaccines();
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = this.extractErrorMessage(error, 'Error deleting vaccine.');
      }
    });
  }

  resetForm(): void {
    this.isEditMode = false;
    this.selectedVaccineId = null;
    this.vaccineForm.reset({
      vaccineName: '',
      scheduledDate: '',
      reminderDate: '',
      notes: ''
    });
  }

  openStatusModal(vaccine: VaccineResponseDTO): void {
    this.modalTargetVaccine = vaccine;
    this.showStatusModal = true;
    this.selectedStatusAction = null;
    this.statusActionSubmitting = false;

    this.statusActionForm.reset({
      takenDate: '',
      batchNumber: '',
      administeredBy: '',
      notes: vaccine.notes || ''
    });

    this.statusActionForm.updateValueAndValidity();
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedStatusAction = null;
    this.modalTargetVaccine = null;
    this.statusActionSubmitting = false;
    this.statusActionForm.reset();
  }

  selectStatusAction(action: StatusAction): void {
    this.selectedStatusAction = action;

    if (action !== 'DONE') {
      this.statusActionForm.patchValue({
        takenDate: '',
        batchNumber: '',
        administeredBy: ''
      });
    }

    this.statusActionForm.updateValueAndValidity();
  }

  submitStatusAction(): void {
    if (!this.modalTargetVaccine || !this.selectedStatusAction) return;

    if (this.selectedStatusAction === 'DONE' && this.statusActionForm.invalid) {
      this.statusActionForm.markAllAsTouched();
      return;
    }

    this.statusActionSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const target = this.modalTargetVaccine;
    const formValue = this.statusActionForm.value;

    const payload: VaccineRequestDTO = {
      vaccineName: target.vaccineName,
      scheduledDate: target.scheduledDate,
      status: this.selectedStatusAction,
      reminderDate:
        this.selectedStatusAction === 'DONE'
          ? target.reminderDate || undefined
          : target.reminderDate || undefined,
      notes:
        this.undefinedIfBlank(formValue.notes) ??
        this.undefinedIfBlank(target.notes)
    };

    if (this.selectedStatusAction === 'DONE') {
      payload.takenDate = this.undefinedIfEmpty(formValue.takenDate);
      payload.batchNumber = this.undefinedIfBlank(formValue.batchNumber);
      payload.administeredBy = this.undefinedIfBlank(formValue.administeredBy);
    }

    if (this.selectedStatusAction === 'MISSED' || this.selectedStatusAction === 'CANCELLED') {
      payload.takenDate = undefined;
      payload.batchNumber = undefined;
      payload.administeredBy = undefined;
    }

    this.vaccineService.updateVaccine(this.babyId, target.id, payload).subscribe({
      next: () => {
        this.successMessage = `Vaccine marked as ${this.selectedStatusAction?.toLowerCase()}.`;
        this.closeStatusModal();
        this.loadVaccines();
        this.statusActionSubmitting = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = this.extractErrorMessage(error, 'Error updating vaccine status.');
        this.statusActionSubmitting = false;
      }
    });
  }

  getDisplayStatus(vaccine: VaccineResponseDTO): DisplayStatus {
    const today = new Date().toISOString().split('T')[0];

    if (vaccine.status === 'DONE') return 'DONE';
    if (vaccine.status === 'CANCELLED') return 'CANCELLED';
    if (vaccine.status === 'MISSED') return 'MISSED';

    if (vaccine.status === 'SCHEDULED' && vaccine.scheduledDate < today) {
      return 'MISSED';
    }

    return 'SCHEDULED';
  }

  isActionableScheduled(vaccine: VaccineResponseDTO): boolean {
    return this.getDisplayStatus(vaccine) === 'SCHEDULED';
  }

  isScheduledOrCancelled(vaccine: VaccineResponseDTO): boolean {
    const status = this.getDisplayStatus(vaccine);
    return status === 'SCHEDULED' || status === 'CANCELLED';
  }

  isDoneOrMissed(vaccine: VaccineResponseDTO): boolean {
    const status = this.getDisplayStatus(vaccine);
    return status === 'DONE' || status === 'MISSED';
  }

  getVisibleStatusLabel(vaccine: VaccineResponseDTO): string {
    const status = this.getDisplayStatus(vaccine);

    switch (status) {
      case 'DONE':
        return 'Done';
      case 'MISSED':
        return 'Missed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Scheduled';
    }
  }

  getStatusClassByVaccine(vaccine: VaccineResponseDTO): string {
    const displayStatus = this.getDisplayStatus(vaccine);

    switch (displayStatus) {
      case 'SCHEDULED':
        return 'status-pill scheduled';
      case 'DONE':
        return 'status-pill done';
      case 'MISSED':
        return 'status-pill missed';
      case 'CANCELLED':
        return 'status-pill cancelled';
      default:
        return 'status-pill';
    }
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.currentPage = 1;
  }

  onPageSizeChange(value: string): void {
    this.pageSize = +value;
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  get filteredVaccines(): VaccineResponseDTO[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.vaccines.filter((vaccine) => {
      const displayStatus = this.getDisplayStatus(vaccine).toLowerCase();

      return (
        !term ||
        vaccine.vaccineName.toLowerCase().includes(term) ||
        displayStatus.includes(term) ||
        (vaccine.administeredBy || '').toLowerCase().includes(term) ||
        (vaccine.batchNumber || '').toLowerCase().includes(term) ||
        (vaccine.notes || '').toLowerCase().includes(term) ||
        vaccine.scheduledDate.toLowerCase().includes(term)
      );
    });
  }

  get paginatedVaccines(): VaccineResponseDTO[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredVaccines.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredVaccines.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get totalVaccines(): number {
    return this.vaccines.length;
  }

  get doneVaccines(): number {
    return this.vaccines.filter((v) => this.getDisplayStatus(v) === 'DONE').length;
  }

  get scheduledVaccines(): number {
    return this.vaccines.filter((v) => this.getDisplayStatus(v) === 'SCHEDULED').length;
  }

  get missedVaccines(): number {
    return this.vaccines.filter((v) => this.getDisplayStatus(v) === 'MISSED').length;
  }

  trackByVaccineId(index: number, vaccine: VaccineResponseDTO): number {
    return vaccine.id;
  }

  private trimOrEmpty(value: string): string {
    return (value || '').trim();
  }

  private undefinedIfEmpty(value: string | null | undefined): string | undefined {
    return value ? value : undefined;
  }

  private undefinedIfBlank(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  private extractErrorMessage(error: any, fallback: string): string {
    return error?.error?.message || error?.error || fallback;
  }
}