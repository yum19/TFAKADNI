import { CommonModule, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { TimelineEventResponseDTO } from '../../../services/module6a/timeline.service';

type EventFilter = 'ALL' | string;

@Component({
  selector: 'app-horizontal-timeline',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, NgClass, DatePipe],
  templateUrl: './horizontal-timeline.component.html',
  styleUrls: ['./horizontal-timeline.component.css']
})
export class HorizontalTimelineComponent implements OnInit, OnChanges {
  @Input() events: TimelineEventResponseDTO[] = [];

  filtered: TimelineEventResponseDTO[] = [];
  activeType: EventFilter = 'ALL';
  selectedEvent: TimelineEventResponseDTO | null = null;
  availableTypes: string[] = [];

  isDragging = false;
  dragStartX = 0;
  scrollStartLeft = 0;

  ngOnInit(): void {
    this.applyFilter();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['events']) {
      this.buildAvailableTypes();
      this.applyFilter();
    }
  }

  buildAvailableTypes(): void {
    const seen = new Set<string>();
    this.events.forEach((e) => {
      const t = (e.eventType || '').toUpperCase();
      if (t) seen.add(t);
    });
    this.availableTypes = Array.from(seen);
  }

  setType(type: EventFilter): void {
    this.activeType = type;
    this.selectedEvent = null;
    this.applyFilter();
  }

  applyFilter(): void {
    let evs = [...this.events];
    if (this.activeType !== 'ALL') {
      evs = evs.filter((e) => (e.eventType || '').toUpperCase() === this.activeType);
    }

    // Oldest -> newest so the timeline reads naturally left to right.
    evs.sort((a, b) => new Date(a.eventDateTime as string).getTime() - new Date(b.eventDateTime as string).getTime());
    this.filtered = evs;
  }

  selectEvent(event: TimelineEventResponseDTO): void {
    this.selectedEvent = this.selectedEvent?.sourceId === event.sourceId ? null : event;
  }

  closePanel(): void {
    this.selectedEvent = null;
  }

  isSelected(event: TimelineEventResponseDTO): boolean {
    return this.selectedEvent?.sourceId === event.sourceId;
  }

  getIcon(type?: string): string {
    switch ((type || '').toUpperCase()) {
      case 'FEEDING':
        return '🍼';
      case 'SLEEP':
        return '🌙';
      case 'DIAPER':
        return '🧷';
      case 'TEETHING':
        return '🦷';
      case 'GROWTH':
        return '📏';
      case 'VACCINE':
        return '💉';
      case 'APPOINTMENT':
        return '🩺';
      case 'MILESTONE':
        return '⭐';
      case 'REMINDER':
        return '🔔';
      case 'INSIGHT':
        return '💡';
      default:
        return '📌';
    }
  }

  formatType(type?: string): string {
    switch ((type || '').toUpperCase()) {
      case 'FEEDING':
        return 'Feeding';
      case 'SLEEP':
        return 'Sleep';
      case 'DIAPER':
        return 'Diaper';
      case 'TEETHING':
        return 'Teething';
      case 'GROWTH':
        return 'Growth';
      case 'VACCINE':
        return 'Vaccine';
      case 'APPOINTMENT':
        return 'Appointment';
      case 'MILESTONE':
        return 'Milestone';
      case 'REMINDER':
        return 'Reminder';
      case 'INSIGHT':
        return 'Insight';
      default:
        return type || 'Other';
    }
  }

  formatPriority(priority?: string): string {
    switch ((priority || '').toUpperCase()) {
      case 'IMPORTANT':
        return '⚡ Important';
      case 'UNUSUAL':
        return '⚠ Unusual';
      case 'TREND_LINKED':
        return '📈 Trend';
      default:
        return '';
    }
  }

  formatStatus(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'RECORDED':
        return '✓ Recorded';
      case 'DONE':
        return '✓ Done';
      case 'COMPLETED':
        return '✓ Completed';
      case 'ADMINISTERED':
        return '✓ Administered';
      case 'TAKEN':
        return '✓ Taken';
      case 'PLANNED':
        return '◷ Planned';
      case 'SCHEDULED':
        return '◷ Scheduled';
      case 'PENDING':
        return '⏳ Pending';
      case 'MISSED':
        return '✗ Missed';
      case 'CANCELLED':
        return '✗ Cancelled';
      default:
        return status || '—';
    }
  }

  isDone(event: TimelineEventResponseDTO): boolean {
    const s = (event.status || '').toUpperCase();
    return ['RECORDED', 'DONE', 'COMPLETED', 'TAKEN', 'ADMINISTERED'].includes(s);
  }

  isImportant(event: TimelineEventResponseDTO): boolean {
    return (event.priority || '').toUpperCase() === 'IMPORTANT';
  }

  isUnusual(event: TimelineEventResponseDTO): boolean {
    return (event.priority || '').toUpperCase() === 'UNUSUAL';
  }

  hasHighPriority(event: TimelineEventResponseDTO): boolean {
    const p = (event.priority || '').toUpperCase();
    return p === 'IMPORTANT' || p === 'UNUSUAL';
  }

  isAbove(index: number): boolean {
    return index % 2 === 0;
  }

  truncate(text: string, max = 18): string {
    return text.length > max ? `${text.slice(0, max)}…` : text;
  }

  statusClass(status?: string): string {
    const s = (status || '').toUpperCase();
    if (['RECORDED', 'DONE', 'COMPLETED', 'ADMINISTERED', 'TAKEN'].includes(s)) return 'st-done';
    if (['PLANNED', 'SCHEDULED'].includes(s)) return 'st-planned';
    if (s === 'PENDING') return 'st-pending';
    if (['MISSED', 'CANCELLED'].includes(s)) return 'st-missed';
    return '';
  }

  nodeTypeClass(type?: string): string {
    return `htl-node-type-${(type || 'other').toLowerCase()}`;
  }

  onMouseDown(e: MouseEvent, scroller: HTMLElement): void {
    this.isDragging = true;
    this.dragStartX = e.pageX - scroller.offsetLeft;
    this.scrollStartLeft = scroller.scrollLeft;
  }

  onMouseMove(e: MouseEvent, scroller: HTMLElement): void {
    if (!this.isDragging) return;
    e.preventDefault();
    const x = e.pageX - scroller.offsetLeft;
    scroller.scrollLeft = this.scrollStartLeft - (x - this.dragStartX) * 1.5;
  }

  onMouseUp(): void {
    this.isDragging = false;
  }

  onMouseLeave(): void {
    this.isDragging = false;
  }

  trackBySourceId(_: number, event: TimelineEventResponseDTO): string {
    return `${event.sourceId}-${event.eventDateTime}`;
  }

  trackByType(_: number, type: string): string {
    return type;
  }
}
