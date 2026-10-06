import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { FeedingRequestDTO, FeedingResponseDTO, FeedingService } from '../../../../../core/services/module6a/feeding.service';

@Component({
  selector: 'app-feeding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './feeding.component.html',
  styleUrls: ['./feeding.component.css']
})
export class FeedingComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  babyId = 0;

  loading = true;
  error = '';
  records: any[] = [];
  itemsCount = 0;
  searchTerm = '';
  currentPage = 1;
  pageSize = 6;

  form!: FormGroup;
  submitting = false;
  submitError = '';
  submitSuccess = '';

  isAddEntryModalOpen = false;
  isEditMode = false;
  selectedRecordId: number | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly feedingService: FeedingService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('babyId'));
    if (!id || Number.isNaN(id)) {
      this.loading = false;
      this.error = 'Invalid baby identifier.';
      return;
    }

    this.babyId = id;
    this.buildForm();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  reload(): void {
    this.loadData();
  }

  openAddEntryModal(): void {
    this.submitError = '';
    this.submitSuccess = '';
    this.isEditMode = false;
    this.selectedRecordId = null;
    this.form.reset({
      feedingMode: 'breastfeeding',
      sideUsed: 'NONE'
    });
    this.isAddEntryModalOpen = true;
  }

  openUpdateEntryModal(record: FeedingResponseDTO): void {
    this.submitError = '';
    this.submitSuccess = '';
    this.isEditMode = true;
    this.selectedRecordId = record.id;
    this.form.patchValue({
      feedingDate: record.feedingDate,
      feedingTime: this.trimSeconds(record.feedingTime),
      feedingMode: record.feedingMode,
      quantity: record.quantity ?? '',
      duration: record.duration ?? '',
      sideUsed: record.sideUsed ?? 'NONE',
      notes: record.notes ?? ''
    });
    this.isAddEntryModalOpen = true;
  }

  closeAddEntryModal(): void {
    this.isAddEntryModalOpen = false;
    this.isEditMode = false;
    this.selectedRecordId = null;
  }

  backToProfilesUrl(): string {
    return '/mother/baby-profiles';
  }

  private loadData(): void {
    this.loading = true;
    this.error = '';

    this.feedingService.getAllFeedingsByBaby(this.babyId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (value) => {
          this.records = Array.isArray(value) ? value : [];
          this.itemsCount = this.records.length;
          this.currentPage = 1;
        },
        error: () => {
          this.error = 'Unable to load feeding records.';
          this.records = [];
          this.itemsCount = 0;
        }
      });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      feedingDate: ['', Validators.required],
      feedingTime: ['', Validators.required],
      feedingMode: ['breastfeeding', Validators.required],
      quantity: ['', Validators.min(0)],
      duration: ['', Validators.min(0)],
      sideUsed: ['NONE'],
      notes: ['', Validators.maxLength(500)]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.submitError = '';
    this.submitSuccess = '';

    const value = this.form.value;

    const payload: FeedingRequestDTO = {
      feedingDate: value.feedingDate,
      feedingTime: this.ensureSeconds(value.feedingTime),
      feedingMode: value.feedingMode,
      quantity: this.optionalNumber(value.quantity),
      duration: this.optionalNumber(value.duration),
      sideUsed: value.sideUsed,
      notes: this.optionalString(value.notes)
    };

    const request$ = this.isEditMode && this.selectedRecordId !== null
      ? this.feedingService.updateFeeding(this.babyId, this.selectedRecordId, payload)
      : this.feedingService.createFeeding(this.babyId, payload);

    request$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.submitting = false))
      )
      .subscribe({
        next: () => {
          this.submitSuccess = this.isEditMode
            ? 'Feeding entry updated successfully.'
            : 'Feeding entry created successfully.';
          this.form.reset();
          this.buildForm();
          this.closeAddEntryModal();
          this.loadData();
        },
        error: () => {
          this.submitError = this.isEditMode
            ? 'Unable to update feeding entry.'
            : 'Unable to create feeding entry.';
        }
      });
  }

  deleteRecord(itemId: any): void {
    const id = Number(itemId);
    if (!Number.isFinite(id)) return;

    this.error = '';

    this.feedingService.deleteFeeding(this.babyId, id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadData(),
        error: () => {
          this.error = 'Unable to delete feeding entry.';
        }
      });
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.currentPage = 1;
  }

  get filteredRecords(): any[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.records;

    return this.records.filter((record) => {
      const searchableValues = this.displayEntries(record)
        .map((entry) => `${entry.key} ${entry.value}`.toLowerCase())
        .join(' ');
      return searchableValues.includes(term);
    });
  }

  get paginatedRecords(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRecords.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRecords.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get hasMultiplePages(): boolean {
    return this.totalPages > 1;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  hasError(field: string, errorKey = 'required'): boolean {
    const control = this.form.get(field);
    return !!control && control.touched && control.hasError(errorKey);
  }

  displayEntries(item: any): Array<{ key: string; value: string }> {
    return Object.entries(item)
      .filter(
        ([key, value]) =>
          !['id', 'babyId', 'createdAt'].includes(key) &&
          value !== null &&
          value !== undefined &&
          value !== ''
      )
      .map(([key, value]) => ({
        key: this.formatLabel(key),
        value: this.formatValue(value)
      }));
  }

  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (char) => char.toUpperCase())
      .trim();
  }

  private formatValue(value: unknown): string {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? `${value}` : value.toFixed(2);
    }
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  }

  private optionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const norm = value.trim();
    return norm ? norm : undefined;
  }

  private optionalNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
  }

  private ensureSeconds(value: string): string {
    if (!value) return value;
    return value.length === 5 ? `${value}:00` : value;
  }

  private trimSeconds(value: string): string {
    if (!value) return value;
    return value.length >= 8 ? value.slice(0, 5) : value;
  }
}