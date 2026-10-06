import { CommonModule, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TimelineEventResponseDTO, TimelineService } from '../../../../../core/services/module6a/timeline.service';

type EventFilter = 'ALL' | string;

interface DayGroup {
  date: string;       // 'YYYY-MM-DD'
  label: string;      // 'Today', 'Yesterday', 'Mon, Jan 12'
  events: TimelineEventResponseDTO[];
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, NgClass, DatePipe],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css']
})
export class TimelineComponent implements OnInit {
  babyId = 0;
  timelineEvents: TimelineEventResponseDTO[] = [];
  filteredEvents: TimelineEventResponseDTO[] = [];
  groupedEvents: DayGroup[] = [];

  loading = false;
  errorMessage = '';

  selectedDays = 7;
  activeType: EventFilter = 'ALL';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly timelineService: TimelineService
  ) {}

  ngOnInit(): void {
    this.babyId = Number(this.route.snapshot.paramMap.get('babyId')) || 0;
    this.loadTimeline();
  }

  loadTimeline(): void {
    this.loading = true;
    this.errorMessage = '';

    const days = this.selectedDays > 0 ? this.selectedDays : undefined;

    this.timelineService.getTimeline(this.babyId, days).subscribe({
      next: (data) => {
        this.timelineEvents = data ?? [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load timeline.';
        this.loading = false;
      }
    });
  }

  setDays(days: number): void {
    this.selectedDays = days;
    this.loadTimeline();
  }

  setType(type: EventFilter): void {
    this.activeType = type;
    this.applyFilters();
  }

  applyFilters(): void {
    let events = [...this.timelineEvents];

    if (this.activeType !== 'ALL') {
      events = events.filter(e => (e.eventType || '').toUpperCase() === this.activeType);
    }

    this.filteredEvents = events;
    this.buildGroups();
  }

  buildGroups(): void {
    const map = new Map<string, TimelineEventResponseDTO[]>();

    for (const event of this.filteredEvents) {
      const key = this.toDateKey(event.eventDateTime);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }

    const today = this.toDateKey(new Date().toISOString());
    const yesterday = this.toDateKey(new Date(Date.now() - 86400000).toISOString());

    this.groupedEvents = Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, events]) => ({
        date,
        label: date === today ? 'Today' : date === yesterday ? 'Yesterday' : this.formatDate(date),
        events
      }));
  }

  private toDateKey(dt: string | Date | null | undefined): string {
    if (!dt) return 'unknown';
    const d = new Date(dt as string);
    return d.toISOString().slice(0, 10);
  }

  private formatDate(key: string): string {
    const d = new Date(key + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  // ── Computed counts ──────────────────────────────────────────

  get importantCount(): number {
    return this.timelineEvents.filter(
      e => e.priority === 'IMPORTANT' || e.priority === 'UNUSUAL'
    ).length;
  }

  get doneCount(): number {
    return this.timelineEvents.filter(e => this.isDone(e)).length;
  }

  isDone(event: TimelineEventResponseDTO): boolean {
    const s = (event.status || '').toUpperCase();
    return ['RECORDED', 'DONE', 'COMPLETED', 'TAKEN', 'ADMINISTERED'].includes(s);
  }

  // ── Formatters ───────────────────────────────────────────────

  getIcon(type?: string): string {
    switch ((type || '').toUpperCase()) {
      case 'FEEDING':     return '🍼';
      case 'SLEEP':       return '🌙';
      case 'DIAPER':      return '🧷';
      case 'TEETHING':    return '🦷';
      case 'GROWTH':      return '📏';
      case 'VACCINE':     return '💉';
      case 'APPOINTMENT': return '🩺';
      case 'MILESTONE':   return '⭐';
      case 'REMINDER':    return '🔔';
      case 'INSIGHT':     return '💡';
      default:            return '📌';
    }
  }

  formatType(type?: string): string {
    switch ((type || '').toUpperCase()) {
      case 'FEEDING':     return 'Feeding';
      case 'SLEEP':       return 'Sleep';
      case 'DIAPER':      return 'Diaper';
      case 'TEETHING':    return 'Teething';
      case 'GROWTH':      return 'Growth';
      case 'VACCINE':     return 'Vaccine';
      case 'APPOINTMENT': return 'Appointment';
      case 'MILESTONE':   return 'Milestone';
      case 'REMINDER':    return 'Reminder';
      case 'INSIGHT':     return 'Insight';
      default:            return type || 'Other';
    }
  }

  formatPriority(priority?: string): string {
    switch ((priority || '').toUpperCase()) {
      case 'IMPORTANT':    return '⚡ Important';
      case 'UNUSUAL':      return '⚠ Unusual';
      case 'TREND_LINKED': return '📈 Trend';
      default:             return '· Normal';
    }
  }

  trackByTimelineId(index: number, event: TimelineEventResponseDTO): string {
    return `${event.sourceId}-${event.eventDateTime}-${index}`;
  }

  trackByDate(index: number, group: DayGroup): string {
    return group.date;
  }
}