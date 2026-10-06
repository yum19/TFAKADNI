import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {
  MoodLogRequestDto,
  MoodLogResponseDto,
  MoodLogService,
} from '../../../../../core/services/module6b/mood-log.service';

type MoodChoice = {
  label: string;
  emoji: string;
  score: number;
  emotionType: string;
  description: string;
};

type WeeklyPoint = {
  shortDate: string;
  fullDate: string;
  score: number;
};

type TrendBadge = {
  label: string;
  icon: string;
  emoji: string;
  arrow: string;
  description: string;
  cssClass: string;
};

@Component({
  selector: 'app-mood-log',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, ReactiveFormsModule],
  templateUrl: './mood-log.component.html',
  styleUrls: ['./mood-log.component.css'],
})
export class MoodLogComponent implements OnInit {
  moodForm!: FormGroup;

  allLogs: MoodLogResponseDto[] = [];
  filteredLogs: MoodLogResponseDto[] = [];
  paginatedLogs: MoodLogResponseDto[] = [];

  loading = true;
  submitting = false;
  errorMessage = '';
  successMessage = '';

  editingId: number | null = null;

  filterEmotion = 'ALL';
  filterShared = 'ALL';
  searchText = '';

  currentPage = 1;
  pageSize = 2;

  readonly moodChoices: MoodChoice[] = [
    {
      label: 'Great',
      emoji: '😄',
      score: 9,
      emotionType: 'GREAT',
      description: 'Feeling bright, calm, and strong today.',
    },
    {
      label: 'Good',
      emoji: '🙂',
      score: 7,
      emotionType: 'GOOD',
      description: 'Feeling stable and emotionally okay.',
    },
    {
      label: 'Okay',
      emoji: '😐',
      score: 5,
      emotionType: 'OKAY',
      description: 'Some mixed feelings, but manageable.',
    },
    {
      label: 'Sad',
      emoji: '😔',
      score: 3,
      emotionType: 'SAD',
      description: 'Feeling emotionally low or tired today.',
    },
    {
      label: 'Anxious',
      emoji: '😣',
      score: 2,
      emotionType: 'ANXIOUS',
      description: 'Feeling tense, worried, or overwhelmed.',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private moodLogService: MoodLogService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadMoodLogs();
  }

  initForm(): void {
    const today = new Date().toISOString().split('T')[0];

    this.moodForm = this.fb.group({
      logDate: [today, Validators.required],
      moodScore: [null, Validators.required],
      emotionType: ['', Validators.required],
      notes: [''],
      isShared: [false],
    });
  }

  loadMoodLogs(): void {
    this.loading = true;
    this.errorMessage = '';

    this.moodLogService.getMoodLogsByMother().subscribe({
      next: (logs) => {
        this.allLogs = [...(logs ?? [])].sort(
          (a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime()
        );
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to load mood logs right now.';
      },
    });
  }

  applyFilters(): void {
    let list = [...this.allLogs];

    if (this.filterEmotion !== 'ALL') {
      list = list.filter(
        (item) => (item.emotionType ?? '').toUpperCase() === this.filterEmotion
      );
    }

    if (this.filterShared !== 'ALL') {
      const expected = this.filterShared === 'SHARED';
      list = list.filter((item) => !!item.isShared === expected);
    }

    const query = this.searchText.trim().toLowerCase();
    if (query) {
      list = list.filter((item) => {
        const emotion = (item.emotionType ?? '').toLowerCase();
        const notes = (item.notes ?? '').toLowerCase();
        const date = item.logDate ?? '';
        return (
          emotion.includes(query) ||
          notes.includes(query) ||
          date.includes(query)
        );
      });
    }

    this.filteredLogs = list;

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }

    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    this.updatePaginatedLogs();
  }

  updatePaginatedLogs(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedLogs = this.filteredLogs.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  onEmotionFilterChange(value: string): void {
    this.filterEmotion = value;
    this.currentPage = 1;
    this.applyFilters();
  }

  onSharedFilterChange(value: string): void {
    this.filterShared = value;
    this.currentPage = 1;
    this.applyFilters();
  }

  onSearchChange(value: string): void {
    this.searchText = value;
    this.currentPage = 1;
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePaginatedLogs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredLogs.length / this.pageSize) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get shouldShowPagination(): boolean {
    return this.filteredLogs.length > this.pageSize;
  }

  selectMood(choice: MoodChoice): void {
    this.moodForm.patchValue({
      moodScore: choice.score,
      emotionType: choice.emotionType,
    });
    this.moodForm.get('moodScore')?.markAsTouched();
    this.moodForm.get('emotionType')?.markAsTouched();
  }

  isMoodSelected(choice: MoodChoice): boolean {
    return (
      this.moodForm.get('moodScore')?.value === choice.score &&
      this.moodForm.get('emotionType')?.value === choice.emotionType
    );
  }

  submitMoodLog(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.moodForm.invalid) {
      this.moodForm.markAllAsTouched();
      this.errorMessage = 'Please choose your mood and complete the required fields.';
      return;
    }

    this.submitting = true;

    const payload: MoodLogRequestDto = {
      logDate: this.moodForm.value.logDate,
      moodScore: this.moodForm.value.moodScore,
      emotionType: this.moodForm.value.emotionType,
      notes: this.moodForm.value.notes,
      isShared: this.moodForm.value.isShared,
    };

    const request$ = this.editingId
      ? this.moodLogService.updateMoodLog(this.editingId, payload)
      : this.moodLogService.createMoodLog(payload);

    request$.subscribe({
      next: () => {
        this.submitting = false;
        this.successMessage = this.editingId
          ? 'Mood log updated successfully.'
          : 'Mood log added successfully.';
        this.resetForm();
        this.loadMoodLogs();
      },
      error: () => {
        this.submitting = false;
        this.errorMessage = this.editingId
          ? 'Unable to update this mood log.'
          : 'Unable to save your mood log.';
      },
    });
  }

  startEdit(log: MoodLogResponseDto): void {
    this.editingId = log.id;
    this.successMessage = '';
    this.errorMessage = '';

    this.moodForm.patchValue({
      logDate: log.logDate,
      moodScore: log.moodScore,
      emotionType: log.emotionType ?? '',
      notes: log.notes ?? '',
      isShared: !!log.isShared,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteLog(log: MoodLogResponseDto): void {
    const confirmed = window.confirm(
      `Delete the mood log from ${this.formatDate(log.logDate)}?`
    );
    if (!confirmed) return;

    this.moodLogService.deleteMoodLog(log.id).subscribe({
      next: () => {
        if (this.editingId === log.id) {
          this.resetForm();
        }
        this.successMessage = 'Mood log deleted successfully.';
        this.loadMoodLogs();
      },
      error: () => {
        this.errorMessage = 'Unable to delete this mood log.';
      },
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.successMessage = '';
    this.errorMessage = '';

    const today = new Date().toISOString().split('T')[0];
    this.moodForm.reset({
      logDate: today,
      moodScore: null,
      emotionType: '',
      notes: '',
      isShared: false,
    });
  }

  getSelectedMood(): MoodChoice | undefined {
    const score = this.moodForm.get('moodScore')?.value;
    const emotionType = this.moodForm.get('emotionType')?.value;

    return this.moodChoices.find(
      (choice) =>
        choice.score === score && choice.emotionType === emotionType
    );
  }

  getCardMoodEmoji(log: MoodLogResponseDto): string {
    const score = log.moodScore ?? 5;
    if (score >= 8) return '😄';
    if (score >= 6) return '🙂';
    if (score >= 4) return '😐';
    if (score >= 2) return '😔';
    return '😣';
  }

  getMoodColorClass(score: number | undefined): string {
    const s = score ?? 5;
    if (s >= 8) return 'mood-great';
    if (s >= 6) return 'mood-good';
    if (s >= 4) return 'mood-okay';
    if (s >= 2) return 'mood-sad';
    return 'mood-anxious';
  }

  getMoodLabel(score: number | undefined, emotionType?: string): string {
    if (emotionType) return emotionType;
    const s = score ?? 5;
    if (s >= 8) return 'GREAT';
    if (s >= 6) return 'GOOD';
    if (s >= 4) return 'OKAY';
    if (s >= 2) return 'SAD';
    return 'ANXIOUS';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  get totalLogs(): number {
    return this.allLogs.length;
  }

  get averageMood(): number {
    if (!this.allLogs.length) return 0;
    const total = this.allLogs.reduce((sum, item) => sum + (item.moodScore ?? 0), 0);
    return Number((total / this.allLogs.length).toFixed(1));
  }

  get sharedCount(): number {
    return this.allLogs.filter((item) => item.isShared).length;
  }

  get thisWeekLogs(): MoodLogResponseDto[] {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);

    return this.allLogs
      .filter((item) => {
        const d = new Date(item.logDate);
        return d >= new Date(sevenDaysAgo.setHours(0, 0, 0, 0));
      })
      .sort(
        (a, b) => new Date(a.logDate).getTime() - new Date(b.logDate).getTime()
      );
  }

  get thisWeekAverage(): number {
    if (!this.thisWeekLogs.length) return 0;
    const total = this.thisWeekLogs.reduce((sum, item) => sum + (item.moodScore ?? 0), 0);
    return Number((total / this.thisWeekLogs.length).toFixed(1));
  }

  get bestMoodThisWeek(): number {
    if (!this.thisWeekLogs.length) return 0;
    return Math.max(...this.thisWeekLogs.map((item) => item.moodScore ?? 0));
  }

  get weeklyChartData(): WeeklyPoint[] {
    const map = new Map<string, number>();
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      map.set(key, 0);
    }

    this.thisWeekLogs.forEach((log) => {
      map.set(log.logDate, log.moodScore ?? 0);
    });

    return Array.from(map.entries()).map(([date, score]) => {
      const d = new Date(date);
      return {
        fullDate: date,
        shortDate: d.toLocaleDateString(undefined, { weekday: 'short' }),
        score,
      };
    });
  }

  get chartPolylinePoints(): string {
    const data = this.weeklyChartData;
    if (!data.length) return '';

    const width = 360;
    const height = 130;
    const paddingX = 14;
    const paddingY = 12;
    const stepX = (width - paddingX * 2) / Math.max(data.length - 1, 1);

    return data
      .map((point, index) => {
        const x = paddingX + index * stepX;
        const normalized = point.score > 0 ? point.score : 0;
        const y =
          height - paddingY - (normalized / 10) * (height - paddingY * 2);
        return `${x},${y}`;
      })
      .join(' ');
  }

  get chartDots(): Array<{ x: number; y: number; value: number; label: string }> {
    const data = this.weeklyChartData;
    const width = 360;
    const height = 130;
    const paddingX = 14;
    const paddingY = 12;
    const stepX = (width - paddingX * 2) / Math.max(data.length - 1, 1);

    return data.map((point, index) => {
      const x = paddingX + index * stepX;
      const normalized = point.score > 0 ? point.score : 0;
      const y =
        height - paddingY - (normalized / 10) * (height - paddingY * 2);
      return {
        x,
        y,
        value: point.score,
        label: point.shortDate,
      };
    });
  }

  get recentMoodScores(): number[] {
    return [...this.allLogs]
      .sort(
        (a, b) => new Date(a.logDate).getTime() - new Date(b.logDate).getTime()
      )
      .map((item) => item.moodScore ?? 0)
      .filter((score) => score > 0);
  }

  get moodTrendBadge(): TrendBadge {
    const scores = this.recentMoodScores;

    if (scores.length < 2) {
      return {
        label: 'New journey',
        icon: 'sparkles',
        emoji: '🌷',
        arrow: '→',
        description: 'Add a few more entries to reveal your emotional trend.',
        cssClass: 'trend-neutral',
      };
    }

    const last = scores[scores.length - 1];
    const previous = scores[scores.length - 2];
    const diff = last - previous;

    if (diff >= 2) {
      return {
        label: 'Getting better',
        icon: 'trending_up',
        emoji: '✨',
        arrow: '↗',
        description: 'Your latest mood looks better than the previous entry.',
        cssClass: 'trend-up',
      };
    }

    if (diff <= -2) {
      return {
        label: 'Needs gentleness',
        icon: 'favorite',
        emoji: '💗',
        arrow: '↘',
        description: 'Your latest mood dropped. Extra care and support may help.',
        cssClass: 'trend-down',
      };
    }

    return {
      label: 'Steady rhythm',
      icon: 'show_chart',
      emoji: '🌸',
      arrow: '→',
      description: 'Your recent emotional pattern looks stable and consistent.',
      cssClass: 'trend-neutral',
    };
  }

  trackByLogId(index: number, item: MoodLogResponseDto): number {
    return item.id;
  }
}