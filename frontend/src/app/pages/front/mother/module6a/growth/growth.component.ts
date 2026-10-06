import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { GrowthRecordService } from '../../../../../core/services/module6a/growth-record.service';

@Component({
  selector: 'app-growth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './growth.component.html',
  styleUrls: ['../document/document.component.css', './growth.component.css']
})
export class GrowthComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  @ViewChild('formCard') private readonly formCard?: ElementRef<HTMLElement>;

  babyId = 0;
  
  loading = true;
  error = '';
  records: any[] = [];
  itemsCount = 0;
  
  form!: FormGroup;
  submitting = false;
  submitError = '';
  submitSuccess = '';
  isEditMode = false;
  selectedRecordId: number | null = null;
  searchTerm = '';
  currentPage = 1;
  pageSize = 6;

  activeTab: 'weight' | 'height' | 'head' = 'weight';

  private rulerConfig = {
    weight: { min: 2,  max: 20,  unit: 'kg', step: 2  },
    height: { min: 45, max: 100, unit: 'cm', step: 10 },
    head:   { min: 30, max: 55,  unit: 'cm', step: 5  },
  };

  get rulerTicks(): { label: string; isMain: boolean }[] {
    const cfg = this.rulerConfig[this.activeTab];
    const ticks: { label: string; isMain: boolean }[] = [];
    for (let v = cfg.max; v >= cfg.min; v -= cfg.step / 2) {
      const isMain = Number.isInteger((v - cfg.min) / cfg.step);
      ticks.push({ label: isMain ? String(v) : '', isMain });
    }
    return ticks;
  }

  get arrowPositionPct(): number {
    const cfg = this.rulerConfig[this.activeTab];
    const field = this.activeTab === 'weight' ? 'weight'
                : this.activeTab === 'height' ? 'height' : 'headCircumference';
    const raw = Number(this.form?.get(field)?.value);
    if (!raw || isNaN(raw)) return 50;
    const clamped = Math.min(Math.max(raw, cfg.min), cfg.max);
    return ((cfg.max - clamped) / (cfg.max - cfg.min)) * 100;
  }

  get arrowLabel(): string {
    const cfg = this.rulerConfig[this.activeTab];
    const field = this.activeTab === 'weight' ? 'weight'
                : this.activeTab === 'height' ? 'height' : 'headCircumference';
    const raw = Number(this.form?.get(field)?.value);
    if (!raw || isNaN(raw)) return '';
    return raw.toFixed(this.activeTab === 'weight' ? 2 : 1) + ' ' + cfg.unit;
  }

  setTab(tab: 'weight' | 'height' | 'head'): void {
    this.activeTab = tab;
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly growthRecordService: GrowthRecordService
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

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.currentPage = 1;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
  }

  get filteredRecords(): any[] {
    const search = this.searchTerm.trim().toLowerCase();

    if (!search) {
      return this.records;
    }

    return this.records.filter((record) =>
      Object.entries(record).some(([key, value]) => {
        if (value === null || value === undefined) {
          return false;
        }

        return String(value).toLowerCase().includes(search);
      })
    );
  }

  get paginatedRecords(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredRecords.slice(startIndex, startIndex + this.pageSize);
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
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  openUpdateRecord(item: any): void {
    if (!item) {
      return;
    }

    this.isEditMode = true;
    this.selectedRecordId = Number(item.id) || null;
    this.submitError = '';
    this.submitSuccess = '';

    this.form.patchValue({
      recordDate: item.recordDate ? String(item.recordDate).slice(0, 10) : '',
      weight: item.weight ?? '',
      height: item.height ?? '',
      headCircumference: item.headCircumference ?? '',
      notes: item.notes ?? ''
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.scrollToForm();
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.selectedRecordId = null;
    this.submitError = '';
    this.form.reset();
    this.buildForm();
  }

  scrollToForm(): void {
    this.formCard?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  backToProfilesUrl(): string {
    return '/mother/baby-profiles';
  }

  private loadData(): void {
    this.loading = true;
    this.error = '';
    this.growthRecordService.getAllGrowthRecords(this.babyId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (value) => {
          this.records = Array.isArray(value) ? value : [];
          this.itemsCount = this.records.length;
          this.currentPage = 1;
        },
        error: () => {
          this.error = 'Unable to load growth records.';
          this.records = [];
          this.itemsCount = 0;
          this.currentPage = 1;
        }
      });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      recordDate: ['', Validators.required],
      weight: ['', [Validators.required, Validators.min(0.1)]],
      height: ['', [Validators.required, Validators.min(1)]],
      headCircumference: ['', Validators.min(1)],
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
    const payload = {
      recordDate: value.recordDate,
      weight: Number(value.weight),
      height: Number(value.height),
      headCircumference: this.optionalNumber(value.headCircumference),
      notes: this.optionalString(value.notes)
    };

    const request$ = this.isEditMode && this.selectedRecordId !== null
      ? this.growthRecordService.updateGrowthRecord(this.babyId, this.selectedRecordId, payload as any)
      : this.growthRecordService.createGrowthRecord(this.babyId, payload as any);

    request$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.submitting = false)
      )
      .subscribe({
        next: () => {
          this.submitSuccess = this.isEditMode ? 'Growth entry updated successfully.' : 'Growth entry created successfully.';
          this.cancelEdit();
          this.loadData();
        },
        error: () => {
          this.submitError = this.isEditMode ? 'Unable to update growth entry.' : 'Unable to create growth entry.';
        }
      });
  }

  deleteRecord(itemId: any): void {
    const id = Number(itemId);
    if (!Number.isFinite(id)) return;

    this.error = '';
    this.growthRecordService.deleteGrowthRecord(this.babyId, id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadData(),
        error: () => {
          this.error = 'Unable to delete growth entry.';
        }
      });
  }

  hasError(field: string, errorKey = 'required'): boolean {
    const control = this.form.get(field);
    return !!control && control.touched && control.hasError(errorKey);
  }

  displayEntries(item: any): Array<{ key: string; value: string }> {
    return Object.entries(item)
      .filter(([key, value]) => !['id', 'babyId', 'createdAt', 'bmi', 'notes'].includes(key) && value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({
        key: this.formatLabel(key),
        value: this.formatValue(value)
      }));
  }

  private formatLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase()).trim();
  }

  private formatValue(value: unknown): string {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return Number.isInteger(value) ? `${value}` : (value as number).toFixed(2);
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
}