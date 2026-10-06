import { CommonModule, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { interval, Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BabyInsightResponseDTO, InsightService } from './../../../../../core/services/module6a/insight.service';

interface SourceCta {
  link: any[];
  text: string;
}

@Component({
  selector: 'app-insight',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgIf, NgFor, NgClass, DatePipe],
  templateUrl: './insight.component.html',
  styleUrls: ['./insight.component.css']
})
export class InsightComponent implements OnInit, OnDestroy {
  babyId!: number;

  insights: BabyInsightResponseDTO[] = [];
  loading = false;
  generating = false;
  error = '';

  searchTerm = '';
  selectedStatus = 'ALL';
  selectedPriority = 'ALL';
  selectedSource = 'ALL';
  sortBy = 'NEWEST';
  showUnreadOnly = false;

  readonly pageSize = 6;
  currentPage = 1;

  private destroy$ = new Subject<void>();
  private syncing = false;

  constructor(
    private insightService: InsightService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.babyId = Number(this.route.snapshot.paramMap.get('babyId'));

    if (!this.babyId || Number.isNaN(this.babyId)) {
      this.error = 'Invalid baby id.';
      return;
    }

    this.syncInsights(true);
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh(): void {
    this.syncInsights(true);
  }

  generateManually(): void {
    this.syncInsights(true);
  }

  private syncInsights(showLoader = false): void {
    if (this.syncing) {
      return;
    }

    this.syncing = true;
    this.error = '';

    if (showLoader) {
      this.generating = true;
      this.loading = true;
    }

    this.insightService.generateInsights(this.babyId).subscribe({
      next: () => this.loadInsightsAfterGenerate(),
      error: () => this.loadInsightsAfterGenerate()
    });
  }

  private loadInsightsAfterGenerate(): void {
    this.insightService.getAllInsights(this.babyId).subscribe({
      next: (data) => {
        this.insights = data ?? [];
        this.clampCurrentPage();
        this.syncing = false;
        this.generating = false;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error while loading insights.';
        this.syncing = false;
        this.generating = false;
        this.loading = false;
      }
    });
  }

  markAsRead(insight: BabyInsightResponseDTO): void {
    if (!this.canMarkAsRead(insight)) return;

    this.insightService.markAsRead(this.babyId, insight.id).subscribe({
      next: (updated) => this.replaceInsight(updated),
      error: () => this.error = 'Unable to mark insight as read.'
    });
  }

  resolveInsight(insight: BabyInsightResponseDTO): void {
    if (!this.canResolve(insight)) return;

    this.insightService.resolveInsight(this.babyId, insight.id).subscribe({
      next: (updated) => this.replaceInsight(updated),
      error: () => this.error = 'Unable to resolve this insight.'
    });
  }

  dismissInsight(insight: BabyInsightResponseDTO): void {
    if (insight.status !== 'ACTIVE') return;

    this.insightService.dismissInsight(this.babyId, insight.id).subscribe({
      next: (updated) => this.replaceInsight(updated),
      error: () => this.error = 'Unable to dismiss this insight.'
    });
  }

  markAllAsRead(): void {
    this.insightService.markAllAsRead(this.babyId).subscribe({
      next: () => {
        this.insights = this.insights.map(i => ({
          ...i,
          isRead: true,
          readAt: i.readAt ?? new Date().toISOString()
        }));
      },
      error: () => this.error = 'Unable to mark all insights as read.'
    });
  }

  replaceInsight(updated: BabyInsightResponseDTO): void {
    this.insights = this.insights.map(i => i.id === updated.id ? updated : i);
    this.clampCurrentPage();
  }

  startAutoRefresh(): void {
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.syncInsights(false);
      });
  }

  canMarkAsRead(insight: BabyInsightResponseDTO): boolean {
    return !insight.isRead;
  }

  canResolve(insight: BabyInsightResponseDTO): boolean {
    if (insight.status !== 'ACTIVE') return false;

    if (insight.insightType === 'INFO' || insight.insightType === 'TREND') {
      return false;
    }

    return [
      'SLEEP',
      'GROWTH',
      'FEEDING',
      'DIAPER',
      'TEETHING',
      'MILESTONE'
    ].includes(insight.sourceModule);
  }

  get filteredInsights(): BabyInsightResponseDTO[] {
    let items = [...this.insights];

    const q = this.searchTerm.trim().toLowerCase();
    if (q) {
      items = items.filter(i =>
        (i.title ?? '').toLowerCase().includes(q) ||
        (i.message ?? '').toLowerCase().includes(q) ||
        (i.sourceModule ?? '').toLowerCase().includes(q) ||
        (i.ruleCode ?? '').toLowerCase().includes(q) ||
        (i.reason ?? '').toLowerCase().includes(q)
      );
    }

    if (this.selectedStatus !== 'ALL') {
      items = items.filter(i => i.status === this.selectedStatus);
    }

    if (this.selectedPriority !== 'ALL') {
      items = items.filter(i => i.priority === this.selectedPriority);
    }

    if (this.selectedSource !== 'ALL') {
      items = items.filter(i => i.sourceModule === this.selectedSource);
    }

    if (this.showUnreadOnly) {
      items = items.filter(i => !i.isRead);
    }

    items.sort((a, b) => {
      switch (this.sortBy) {
        case 'OLDEST':
          return new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime();
        case 'PRIORITY':
          return this.priorityRank(b.priority) - this.priorityRank(a.priority);
        case 'UNREAD':
          return Number(a.isRead) - Number(b.isRead);
        case 'NEWEST':
        default:
          return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
      }
    });

    return items;
  }

  get totalPages(): number {
    const total = this.filteredInsights.length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  get paginatedInsights(): BabyInsightResponseDTO[] {
    const items = this.filteredInsights;
    const start = (this.currentPage - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  resetPagination(): void {
    this.currentPage = 1;
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  private clampCurrentPage(): void {
    const total = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    if (this.currentPage > total) this.currentPage = total;
  }

  priorityRank(priority?: string): number {
    if (priority === 'HIGH') return 3;
    if (priority === 'MEDIUM') return 2;
    return 1;
  }

  get totalCount(): number {
    return this.insights.length;
  }

  get unreadCount(): number {
    return this.insights.filter(i => !i.isRead).length;
  }

  get resolvedCount(): number {
    return this.insights.filter(i => i.status === 'RESOLVED').length;
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'st-active';
      case 'RESOLVED':
        return 'st-resolved';
      case 'DISMISSED':
        return 'st-dismissed';
      default:
        return 'st-unknown';
    }
  }

  getPriorityClass(priority?: string): string {
    return priority === 'HIGH' ? 'pri-important' : 'pri-normal';
  }

  getSourceCta(sourceModule?: string | null): SourceCta | null {
    const mod = (sourceModule || '').toUpperCase();

    switch (mod) {
      case 'SLEEP':
        return { link: ['/mother/babies', this.babyId, 'sleep'], text: 'View sleep logs' };
      case 'GROWTH':
        return { link: ['/mother/babies', this.babyId, 'growth'], text: 'View growth logs' };
      case 'FEEDING':
        return { link: ['/mother/babies', this.babyId, 'feeding'], text: 'View feeding logs' };
      case 'DIAPER':
        return { link: ['/mother/babies', this.babyId, 'diapers'], text: 'View diaper logs' };
      case 'TEETHING':
        return { link: ['/mother/babies', this.babyId, 'teething'], text: 'View teething logs' };
      case 'MILESTONE':
        return { link: ['/mother/babies', this.babyId, 'milestones'], text: 'View milestones' };
      default:
        return null;
    }
  }
}