import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  SleepLogRequestDTO,
  SleepLogResponseDTO,
  SleepLogService,
  SleepQuality
} from '../../../../../core/services/module6a/sleep-log.service';

interface WeekBar {
  label: string;
  heightPct: number;
  hoursLabel: string;
  quality: string;
  isToday: boolean;
}

@Component({
  selector: 'app-sleep-log',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sleep-log.component.html',
  styleUrls: ['../document/document.component.css', './sleep-log.component.css']
})
export class SleepLogComponent implements OnInit {
  babyId!: number;

  @ViewChild('formCard') private readonly formCard?: ElementRef<HTMLElement>;

  sleepLogs: SleepLogResponseDTO[] = [];
  searchTerm = '';
  currentPage = 1;
  pageSize = 2;
  loading    = false;
  submitting = false;
  isEditMode = false;
  selectedLogId: number | null = null;
  errorMessage   = '';
  successMessage = '';

  sleepQualities: SleepQuality[] = ['GOOD', 'RESTLESS', 'INTERRUPTED'];

  weekBars: WeekBar[] = [];

  sleepForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private sleepLogService: SleepLogService,
    private route: ActivatedRoute
  ) {}

  // ─── Lifecycle ────────────────────────────────

  ngOnInit(): void {
    this.initForm();

    const babyIdParam = this.route.snapshot.paramMap.get('babyId');
    this.babyId = babyIdParam ? +babyIdParam : 1;

    this.buildWeekBars();
    this.loadLogs();
  }

  // ─── Navigation ───────────────────────────────

  backToProfilesUrl(): string {
    return '/mother/baby-profiles';
  }

  scrollToForm(): void {
    this.formCard?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ─── Form ─────────────────────────────────────

  initForm(): void {
    this.sleepForm = this.fb.group({
      sleepStart: ['', Validators.required],
      sleepEnd:   ['', Validators.required],
      quality:    ['', Validators.required],
      notes:      ['']
    });
  }

  /** Click a quality pill → patch hidden select value */
  setQuality(q: SleepQuality): void {
    this.sleepForm.patchValue({ quality: q });
  }

  // ─── CRUD ─────────────────────────────────────

  loadLogs(): void {
    this.loading      = true;
    this.errorMessage = '';

    this.sleepLogService.getAllSleepLogsByBaby(this.babyId).subscribe({
      next: (data) => {
        this.sleepLogs = data;
        this.currentPage = 1;
        this.loading   = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Error loading sleep logs.';
        this.loading      = false;
      }
    });
  }

  onSubmit(): void {
    if (this.sleepForm.invalid) {
      this.sleepForm.markAllAsTouched();
      return;
    }

    this.submitting     = true;
    this.errorMessage   = '';
    this.successMessage = '';

    const payload: SleepLogRequestDTO = {
      sleepStart: this.sleepForm.value.sleepStart,
      sleepEnd:   this.sleepForm.value.sleepEnd,
      quality:    this.sleepForm.value.quality,
      notes:      this.sleepForm.value.notes?.trim() || undefined
    };

    if (this.isEditMode && this.selectedLogId !== null) {
      this.sleepLogService.updateSleepLog(this.babyId, this.selectedLogId, payload).subscribe({
        next: () => {
          this.successMessage = 'Sleep log updated successfully.';
          this.resetForm();
          this.loadLogs();
          this.submitting = false;
          this.fireEmojiRain(['✅', '🌙', '⭐', '✨']);
        },
        error: (error) => {
          console.error(error);
          this.errorMessage = 'Error updating sleep log.';
          this.submitting   = false;
        }
      });
    } else {
      this.sleepLogService.createSleepLog(this.babyId, payload).subscribe({
        next: () => {
          this.successMessage = 'Sleep log created successfully.';
          this.resetForm();
          this.loadLogs();
          this.submitting = false;
          this.fireEmojiRain(['🌙', '⭐', '💫', '✨', '😴', '💤', '🌟']);
        },
        error: (error) => {
          console.error(error);
          this.errorMessage = 'Error creating sleep log.';
          this.submitting   = false;
        }
      });
    }
  }

  editLog(log: SleepLogResponseDTO): void {
    this.isEditMode    = true;
    this.selectedLogId = log.id;
    this.errorMessage  = '';
    this.successMessage = '';

    this.sleepForm.patchValue({
      sleepStart: this.toDateTimeLocalValue(log.sleepStart),
      sleepEnd:   this.toDateTimeLocalValue(log.sleepEnd),
      quality:    log.quality,
      notes:      log.notes || ''
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteLog(logId: number): void {
    const confirmed = window.confirm('Are you sure you want to delete this sleep log?');
    if (!confirmed) return;

    this.errorMessage   = '';
    this.successMessage = '';

    this.sleepLogService.deleteSleepLog(this.babyId, logId).subscribe({
      next: () => {
        this.successMessage = 'Sleep log deleted successfully.';
        this.loadLogs();
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = 'Error deleting sleep log.';
      }
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
  }

  get filteredSleepLogs(): SleepLogResponseDTO[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.sleepLogs;
    }

    return this.sleepLogs.filter((log) => {
      const haystack = [
        log.quality,
        log.notes,
        log.sleepStart,
        log.sleepEnd,
        this.getDurationText(log.sleepStart, log.sleepEnd)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }

  get paginatedSleepLogs(): SleepLogResponseDTO[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredSleepLogs.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredSleepLogs.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  resetForm(): void {
    this.isEditMode    = false;
    this.selectedLogId = null;
    this.sleepForm.reset();
  }

  // ─── Display helpers ──────────────────────────

  getDurationText(sleepStart: string, sleepEnd: string): string {
    const start   = new Date(sleepStart).getTime();
    const end     = new Date(sleepEnd).getTime();
    const minutes = Math.floor((end - start) / 1000 / 60);
    const hours   = Math.floor(minutes / 60);
    const mins    = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  getQualityEmoji(quality: string): string {
    switch (quality) {
      case 'GOOD':        return '😴';
      case 'RESTLESS':    return '😰';
      case 'INTERRUPTED': return '😤';
      default:            return '🌙';
    }
  }

  trackByLogId(_index: number, log: SleepLogResponseDTO): number {
    return log.id;
  }

  // ─── Week chart ───────────────────────────────

  private buildWeekBars(): void {
    const days    = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const mockHrs = [7.5, 6.2, 8.1, 5.8, 9.0, 7.3, 8.4];
    const mockQ   = ['GOOD', 'RESTLESS', 'GOOD', 'RESTLESS', 'GOOD', 'INTERRUPTED', 'GOOD'];
    const maxH    = Math.max(...mockHrs);
    const todayIdx = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; })();

    this.weekBars = days.map((label, i) => ({
      label,
      heightPct: Math.round((mockHrs[i] / maxH) * 100),
      hoursLabel: `${mockHrs[i].toFixed(1)}h`,
      quality:   mockQ[i],
      isToday:   i === todayIdx
    }));
  }

  // ─── Emoji rain on success ────────────────────

  fireEmojiRain(emojis: string[]): void {
    const container = document.getElementById('emojiRainContainer');
    if (!container) return;

    for (let i = 0; i < 20; i++) {
      const el        = document.createElement('div');
      el.className    = 'rain-piece';
      el.textContent  = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left   = `${Math.random() * 100}vw`;
      el.style.animationDelay = `${(Math.random() * 0.7).toFixed(2)}s`;
      el.style.fontSize       = `${Math.floor(14 + Math.random() * 14)}px`;
      container.appendChild(el);
      setTimeout(() => el.remove(), 2500);
    }
  }

  // ─── Private utils ────────────────────────────

  private toDateTimeLocalValue(dateString: string): string {
    return dateString?.slice(0, 16) || '';
  }
}