import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component, OnDestroy, OnInit,
  ApplicationRef, ComponentRef,
  createComponent, EnvironmentInjector,
  Inject, Input, Output, EventEmitter
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import {
  BabyRequestDTO,
  BabyResponseDTO,
  BabyService
} from '../../../../core/services/module6a/baby.service';
import {
  BabyDashboardDTO,
  DashboardService
} from '../../../../core/services/module6a/dashboard.service';
import {
  GrowthRecordResponseDTO,
  GrowthRecordService
} from '../../../../core/services/module6a/growth-record.service';
import {
  CareScoreResponseDTO,
  CareScoreService
} from '../../../../core/services/module6a/care-score.service';
import {
  GrowthStoryResponseDTO,
  GrowthStoryService
} from '../../../../core/services/module6a/growth-story.service';
import {
  BabyMilestoneResponseDTO,
  MilestoneService
} from '../../../../core/services/module6a/milestone.service';
import {
  TodaySummaryResponseDTO,
  TodaySummaryService
} from '../../../../core/services/module6a/today-summary.service';
import {
  TimelineEventResponseDTO,
  TimelineService
} from '../../../../core/services/module6a/timeline.service';

type GrowthMetric = 'weight' | 'height' | 'bmi';

type ChartPoint = {
  x: number;
  y: number;
  value: number;
  label: string;
};

type AxisTick = {
  y: number;
  label: string;
};

type XAxisLabel = {
  left: number;
  label: string;
};

type EditableBabyProfile = {
  firstName: string;
  lastName: string;
  gender: 'FEMALE' | 'MALE' | '';
  birthDate: string;
  birthPlace: string;
  birthWeight: number | null;
  birthHeight: number | null;
  gestationalAgeAtBirth: number | null;
  bloodType: string;
  deliveryType: string;
  notes: string;
};

type UpcomingHealthEventKind = 'vaccines' | 'appointments';

type UpcomingHealthEventDetails = {
  kind: UpcomingHealthEventKind;
  title: string;
  label: string;
  dateLabel: string;
  details: string[];
  route: string[];
  icon: string;
  description: string;
  actionLabel: string;
};

@Component({
  selector: 'app-baby-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, MatIconModule],
  templateUrl: './baby-detail.component.html',
  styleUrls: ['./baby-detail.component.css']
})
export class BabyDetailComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  babyId = 0;
  loading = true;
  error = '';

  baby: BabyResponseDTO | null = null;
  dashboard: BabyDashboardDTO | null = null;
  growthRecords: GrowthRecordResponseDTO[] = [];
  latestMilestone: BabyMilestoneResponseDTO | null = null;
  growthStory: GrowthStoryResponseDTO | null = null;
  todaySummary: TodaySummaryResponseDTO | null = null;

  chartMetric: GrowthMetric = 'weight';
  chartSeries: ChartPoint[] = [];
  chartLinePoints = '';
  chartAreaPoints = '';
  chartXAxisLabels: XAxisLabel[] = [];
  chartYAxisTicks: AxisTick[] = [];
  chartColor = '#f43f5e';
  chartMetricTitle = 'WEIGHT';

  careScore: CareScoreResponseDTO | null = null;
  timelineEvents: TimelineEventResponseDTO[] = [];
  htlFiltered: TimelineEventResponseDTO[] = [];
  htlActiveType: 'ALL' | string = 'ALL';
  htlSelectedEvent: TimelineEventResponseDTO | null = null;
  htlAvailableTypes: string[] = [];
  htlIsDragging = false;
  htlDragStartX = 0;
  htlScrollStartLeft = 0;
  isCareScoreModalOpen = false;
  isTodaySummaryModalOpen = false;
  todaySummaryLoading = false;
  todaySummaryError = '';

  isHtlEventModalOpen = false;
  htlModalEvent: TimelineEventResponseDTO | null = null;

  isUpcomingHealthModalOpen = false;
  selectedUpcomingHealthEvent: UpcomingHealthEventDetails | null = null;

  isEditMode = false;
  isSavingProfile = false;
  profileMessage = '';
  profileError = '';

  isUpdatingPhoto = false;
  photoMessage = '';
  photoError = '';

  todayString = new Date().toISOString().split('T')[0];

  editModel: EditableBabyProfile = {
    firstName: '',
    lastName: '',
    gender: '',
    birthDate: '',
    birthPlace: '',
    birthWeight: null,
    birthHeight: null,
    gestationalAgeAtBirth: null,
    bloodType: '',
    deliveryType: '',
    notes: ''
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly babyService: BabyService,
    private readonly dashboardService: DashboardService,
    private readonly growthRecordService: GrowthRecordService,
    private readonly careScoreService: CareScoreService,
    private readonly growthStoryService: GrowthStoryService,
    private readonly milestoneService: MilestoneService,
    private readonly timelineService: TimelineService,
    private readonly todaySummaryService: TodaySummaryService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('babyId'));
    if (!id || Number.isNaN(id)) {
      this.loading = false;
      this.error = 'Invalid baby identifier.';
      return;
    }
    this.babyId = id;
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.document.body.style.overflow = '';
  }

  reload(): void { this.loadData(); }

  setChartMetric(metric: GrowthMetric): void {
    if (this.chartMetric === metric) {
      return;
    }

    this.chartMetric = metric;
    this.chartColor = this.getMetricColor(metric);
    this.chartMetricTitle = metric.toUpperCase();
    this.rebuildGrowthChart();
  }

  currentMetricValue(metric: GrowthMetric): number | null {
    if (metric === 'weight') {
      return this.dashboard?.latestWeight ?? this.baby?.birthWeight ?? null;
    }

    if (metric === 'height') {
      return this.dashboard?.latestHeight ?? this.baby?.birthHeight ?? null;
    }

    if (this.growthRecords.length > 0) {
      const sorted = [...this.growthRecords].sort(
        (a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime()
      );
      return sorted[sorted.length - 1].bmi ?? null;
    }

    const birthWeight = this.baby?.birthWeight;
    const birthHeight = this.baby?.birthHeight;
    if (!birthWeight || !birthHeight) {
      return null;
    }

    const heightMeters = birthHeight / 100;
    if (!heightMeters) {
      return null;
    }

    return Number((birthWeight / (heightMeters * heightMeters)).toFixed(1));
  }

  metricUnit(metric: GrowthMetric): string {
    if (metric === 'weight') {
      return 'kg';
    }
    if (metric === 'height') {
      return 'cm';
    }
    return 'BMI';
  }

  careScorePercent(): number {
    if (!this.careScore) {
      return 0;
    }

    const rawScore = Number(this.careScore.score ?? 0);
    if (Number.isNaN(rawScore)) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round(rawScore)));
  }

  careScoreState(): string {
    const totalScore = this.careScorePercent();
    if (totalScore >= 85) return 'EXCELLENT';
    if (totalScore >= 65) return 'GOOD';
    if (totalScore >= 40) return 'MEDIUM';
    return 'LOW';
  }

  careScoreStrokeOffset(): number {
    const radius = 46;
    const circumference = 2 * Math.PI * radius;
    const progress = this.careScorePercent() / 100;
    return circumference * (1 - progress);
  }

  openCareScoreDetails(): void {
    this.isCareScoreModalOpen = true;
    this.syncBodyScrollLock();
  }

  closeCareScoreDetails(): void {
    this.isCareScoreModalOpen = false;
    this.syncBodyScrollLock();
  }

  openTodaySummaryPopup(): void {
    this.isTodaySummaryModalOpen = true;
    this.todaySummaryError = '';

    if (!this.todaySummary && !this.todaySummaryLoading) {
      this.loadTodaySummary();
    }

    this.syncBodyScrollLock();
  }

  closeTodaySummaryPopup(): void {
    this.isTodaySummaryModalOpen = false;
    this.syncBodyScrollLock();
  }

  loadTodaySummary(): void {
    this.todaySummaryLoading = true;
    this.todaySummaryError = '';

    this.todaySummaryService.getTodaySummary(this.babyId).subscribe({
      next: (summary) => {
        this.todaySummary = summary;
        this.todaySummaryLoading = false;
      },
      error: () => {
        this.todaySummaryError = 'Unable to load today summary.';
        this.todaySummaryLoading = false;
      }
    });
  }

  openUpcomingHealthDetails(kind: UpcomingHealthEventKind): void {
    const event = this.getUpcomingHealthEvent(kind);
    if (!event) {
      return;
    }

    this.selectedUpcomingHealthEvent = event;
    this.isUpcomingHealthModalOpen = true;
    this.syncBodyScrollLock();
  }

  closeUpcomingHealthDetails(): void {
    this.isUpcomingHealthModalOpen = false;
    this.selectedUpcomingHealthEvent = null;
    this.syncBodyScrollLock();
  }

  htlSetType(type: 'ALL' | string): void {
    this.htlActiveType = type;
    this.htlSelectedEvent = null;
    this.htlApplyFilter();
  }

  htlSelectEvent(event: TimelineEventResponseDTO): void {
    this.htlSelectedEvent = this.htlSelectedEvent?.sourceId === event.sourceId ? null : event;
  }

  htlClosePanel(): void {
    this.htlSelectedEvent = null;
  }

  openHtlEventModal(event?: TimelineEventResponseDTO | null): void {
    const selected = event ?? this.htlSelectedEvent;
    if (!selected) {
      return;
    }

    this.htlModalEvent = selected;
    this.isHtlEventModalOpen = true;
    this.syncBodyScrollLock();
  }

  closeHtlEventModal(): void {
    this.isHtlEventModalOpen = false;
    this.htlModalEvent = null;
    this.syncBodyScrollLock();
  }

  htlIsSelected(event: TimelineEventResponseDTO): boolean {
    return this.htlSelectedEvent?.sourceId === event.sourceId;
  }

  htlGetIcon(type?: string): string {
    switch ((type || '').toUpperCase()) {
      case 'FEEDING': return '🍼';
      case 'SLEEP': return '🌙';
      case 'DIAPER': return '🧷';
      case 'TEETHING': return '🦷';
      case 'GROWTH': return '📏';
      case 'VACCINE': return '💉';
      case 'APPOINTMENT': return '🩺';
      case 'MILESTONE': return '⭐';
      case 'REMINDER': return '🔔';
      case 'INSIGHT': return '💡';
      default: return '📌';
    }
  }

  htlFormatType(type?: string): string {
    switch ((type || '').toUpperCase()) {
      case 'FEEDING': return 'Feeding';
      case 'SLEEP': return 'Sleep';
      case 'DIAPER': return 'Diaper';
      case 'TEETHING': return 'Teething';
      case 'GROWTH': return 'Growth';
      case 'VACCINE': return 'Vaccine';
      case 'APPOINTMENT': return 'Appointment';
      case 'MILESTONE': return 'Milestone';
      case 'REMINDER': return 'Reminder';
      case 'INSIGHT': return 'Insight';
      default: return type || 'Other';
    }
  }

  htlDisplayTitle(event: TimelineEventResponseDTO): string {
    const rawTitle = (event.title || '').trim();
    const fallback = this.htlFormatType(event.eventType);
    let title = rawTitle || fallback;

    // Best-effort translation of common French prefixes coming from the backend.
    title = title.replace(/^Mesure de croissance\b/i, 'Growth measurement');
    title = title.replace(/^Rendez-vous\b/i, 'Appointment');
    title = title.replace(/^Rappel\b/i, 'Reminder');
    title = title.replace(/^Repas\b/i, 'Feeding');
    title = title.replace(/^Sommeil\b/i, 'Sleep');
    title = title.replace(/^Change\b/i, 'Diaper');
    title = title.replace(/^Dentition\b/i, 'Teething');
    title = title.replace(/^Croissance\b/i, 'Growth');
    title = title.replace(/^Vaccins\b/i, 'Vaccines');
    title = title.replace(/^Vaccin\b/i, 'Vaccine');

    return title;
  }

  htlDisplayDescription(event: TimelineEventResponseDTO): string | null {
    const raw = (event.description || '').trim();
    if (!raw) {
      return null;
    }

    // Targeted translation for growth measurements (matches screenshot content).
    if ((event.eventType || '').toUpperCase() === 'GROWTH') {
      return raw
        .replace(/\bPoids\s*:/gi, 'Weight:')
        .replace(/\btaille\s*:/gi, 'Height:')
        .replace(/\bPC\s*:/g, 'Head circ.:')
        .replace(/\bIMC\s*:/gi, 'BMI:');
    }

    return raw;
  }

  htlFormatPriority(priority?: string): string {
    switch ((priority || '').toUpperCase()) {
      case 'IMPORTANT': return '⚡ Important';
      case 'UNUSUAL': return '⚠ Unusual';
      case 'TREND_LINKED': return '📈 Trend';
      default: return '';
    }
  }

  htlFormatStatus(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'RECORDED': return '✓ Recorded';
      case 'DONE': return '✓ Done';
      case 'COMPLETED': return '✓ Completed';
      case 'ADMINISTERED': return '✓ Administered';
      case 'TAKEN': return '✓ Taken';
      case 'PLANNED': return '◷ Planned';
      case 'SCHEDULED': return '◷ Scheduled';
      case 'PENDING': return '⏳ Pending';
      case 'MISSED': return '✗ Missed';
      case 'CANCELLED': return '✗ Cancelled';
      default: return status || '—';
    }
  }

  htlIsDone(event: TimelineEventResponseDTO): boolean {
    const s = (event.status || '').toUpperCase();
    return ['RECORDED', 'DONE', 'COMPLETED', 'TAKEN', 'ADMINISTERED'].includes(s);
  }

  htlIsImportant(event: TimelineEventResponseDTO): boolean {
    return (event.priority || '').toUpperCase() === 'IMPORTANT';
  }

  htlIsUnusual(event: TimelineEventResponseDTO): boolean {
    return (event.priority || '').toUpperCase() === 'UNUSUAL';
  }

  htlHasHighPriority(event: TimelineEventResponseDTO): boolean {
    const p = (event.priority || '').toUpperCase();
    return p === 'IMPORTANT' || p === 'UNUSUAL';
  }

  htlIsAbove(index: number): boolean {
    return index % 2 === 0;
  }

  htlTruncate(text: string, max = 18): string {
    return text.length > max ? `${text.slice(0, max)}…` : text;
  }

  htlStatusClass(status?: string): string {
    const s = (status || '').toUpperCase();
    if (['RECORDED', 'DONE', 'COMPLETED', 'ADMINISTERED', 'TAKEN'].includes(s)) return 'st-done';
    if (['PLANNED', 'SCHEDULED'].includes(s)) return 'st-planned';
    if (s === 'PENDING') return 'st-pending';
    if (['MISSED', 'CANCELLED'].includes(s)) return 'st-missed';
    return '';
  }

  htlNodeTypeClass(type?: string): string {
    return `htl-node-type-${(type || 'other').toLowerCase()}`;
  }

  htlOnMouseDown(e: MouseEvent, scroller: HTMLElement): void {
    this.htlIsDragging = true;
    this.htlDragStartX = e.pageX - scroller.offsetLeft;
    this.htlScrollStartLeft = scroller.scrollLeft;
  }

  htlOnMouseMove(e: MouseEvent, scroller: HTMLElement): void {
    if (!this.htlIsDragging) return;
    e.preventDefault();
    const x = e.pageX - scroller.offsetLeft;
    scroller.scrollLeft = this.htlScrollStartLeft - (x - this.htlDragStartX) * 1.5;
  }

  htlOnMouseUp(): void {
    this.htlIsDragging = false;
  }

  htlOnMouseLeave(): void {
    this.htlIsDragging = false;
  }

  htlTrackBySourceId(_: number, event: TimelineEventResponseDTO): string {
    return `${event.sourceId}-${event.eventDateTime}`;
  }

  htlTrackByType(_: number, type: string): string {
    return type;
  }

  getGenderLabel(gender?: string | null): string {
    if (gender === 'MALE')   return 'Boy';
    if (gender === 'FEMALE') return 'Girl';
    return gender ?? 'Unknown';
  }

  getBabyAgeText(birthDate?: string | Date | null): string {
    if (!birthDate) return 'Age unavailable';
    const birth = new Date(birthDate);
    const today = new Date();
    if (Number.isNaN(birth.getTime()) || birth > today) return 'Age unavailable';

    let years  = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth()    - birth.getMonth();
    let days   = today.getDate()     - birth.getDate();

    if (days < 0)   { months--; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
    if (months < 0) { years--;  months += 12; }

    if (years  > 0) return `${years} year${years   > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ${days} day${days > 1 ? 's' : ''}`;
    return `${days} day${days > 1 ? 's' : ''}`;
  }

  getShortNote(notes?: string | null): string {
    if (!notes?.trim()) return 'No additional notes available.';
    return notes.length > 130 ? `${notes.slice(0, 130)}...` : notes;
  }

  formatGrowthStoryText(text?: string | null): string {
    if (!text) {
      return '';
    }

    return text.replace(/-?\d+\.\d+/g, (match) => {
      const value = Number(match);

      if (Number.isNaN(value)) {
        return match;
      }

      return value.toFixed(3);
    });
  }

  formatGrowthStoryHtml(text?: string | null): string {
    const formatted = this.escapeHtml(this.formatGrowthStoryText(text));

    return formatted
      .replace(/(Weight difference:\s*[^.]*\.?)/i, '<br><span class="story-line story-line-diff">- $1</span>')
      .replace(/(Height difference:\s*[^.]*\.?)/i, '<br><span class="story-line story-line-diff">- $1</span>')
      .replace(/(Head circumference difference:\s*[^.]*\.?)/i, '<br><span class="story-line story-line-diff">- $1</span>')
      .replace(/(Status:\s*[^.]*\.?)/i, '<br><span class="story-line story-status">- $1</span>');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  getInitials(firstName?: string | null, lastName?: string | null): string {
    const f = (firstName || '').trim().charAt(0);
    const l = (lastName  || '').trim().charAt(0);
    return `${f}${l}`.toUpperCase() || 'BB';
  }

  getLatestMilestoneMediaLabel(): string {
    switch ((this.latestMilestone?.mediaType || '').toUpperCase()) {
      case 'PHOTO': return 'Photo';
      case 'VIDEO': return 'Video';
      case 'AUDIO': return 'Audio';
      default: return 'Memory';
    }
  }

  getUpcomingHealthEvent(kind: UpcomingHealthEventKind): UpcomingHealthEventDetails | null {
    if (kind === 'vaccines') {
      if (!this.dashboard?.upcomingVaccineName && !this.dashboard?.upcomingVaccineDate) {
        return null;
      }

      const dateLabel = this.dashboard?.upcomingVaccineDate
        ? new Date(this.dashboard.upcomingVaccineDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Date not set';

      return {
        kind,
        title: this.dashboard?.upcomingVaccineName || 'Upcoming vaccine',
        label: 'Vaccine',
        dateLabel,
        details: [
          `Scheduled for ${dateLabel}.`,
          'This is the next vaccine item in the baby timeline.'
        ],
        route: ['/mother/babies', String(this.babyId), 'vaccines'],
        icon: 'health_and_safety',
        description: 'This event is the next vaccine-related milestone in the baby timeline.',
        actionLabel: 'Open vaccines page'
      };
    }

    if (!this.dashboard?.upcomingAppointmentType && !this.dashboard?.upcomingAppointmentDate && !this.dashboard?.upcomingDoctorName) {
      return null;
    }

    const dateLabel = this.dashboard?.upcomingAppointmentDate
      ? new Date(this.dashboard.upcomingAppointmentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Date not set';

    return {
      kind,
      title: this.dashboard?.upcomingAppointmentType || 'Upcoming appointment',
      label: 'Appointment',
      dateLabel,
      details: [
        `Scheduled for ${dateLabel}.`,
        this.dashboard?.upcomingDoctorName
          ? `Planned with ${this.dashboard.upcomingDoctorName}.`
          : 'No doctor name is attached yet.'
      ],
      route: ['/mother/babies', String(this.babyId), 'appointments'],
      icon: 'event',
      description: this.dashboard?.upcomingDoctorName
        ? `Planned with ${this.dashboard.upcomingDoctorName}.`
        : 'This is the next appointment in the baby timeline.',
      actionLabel: 'Open appointments page'
    };
  }

  hasLatestMilestoneMedia(): boolean {
    return !!this.latestMilestone?.mediaUrl && !!this.latestMilestone?.mediaType;
  }

  isLatestMilestonePhoto(): boolean {
    return (this.latestMilestone?.mediaType || '').toUpperCase() === 'PHOTO' && !!this.latestMilestone?.mediaUrl;
  }

  isLatestMilestoneVideo(): boolean {
    return (this.latestMilestone?.mediaType || '').toUpperCase() === 'VIDEO' && !!this.latestMilestone?.mediaUrl;
  }

  isLatestMilestoneAudio(): boolean {
    return (this.latestMilestone?.mediaType || '').toUpperCase() === 'AUDIO' && !!this.latestMilestone?.mediaUrl;
  }

  openEditProfile(): void {
    if (!this.baby) return;
    this.profileMessage = '';
    this.profileError   = '';

    this.editModel = {
      firstName:             this.baby.firstName   || '',
      lastName:              this.baby.lastName    || '',
      gender:                (this.baby.gender as 'FEMALE' | 'MALE') || '',
      birthDate:             this.baby.birthDate   || '',
      birthPlace:            this.baby.birthPlace  || '',
      birthWeight:           this.baby.birthWeight           ?? null,
      birthHeight:           this.baby.birthHeight           ?? null,
      gestationalAgeAtBirth: this.baby.gestationalAgeAtBirth ?? null,
      bloodType:             this.baby.bloodType    || '',
      deliveryType:          this.baby.deliveryType || '',
      notes:                 this.baby.notes        || ''
    };

    this.isEditMode = true;
    this.syncBodyScrollLock();
  }

  cancelEditProfile(): void {
    this.isEditMode     = false;
    this.profileError   = '';
    this.profileMessage = '';
    this.syncBodyScrollLock();
  }

  saveProfileChanges(): void {
    if (!this.baby) return;

    const firstName = this.editModel.firstName.trim();
    const lastName  = this.editModel.lastName.trim();

    if (!firstName || !lastName) {
      this.profileError = 'First name and last name are required.';
      return;
    }
    if (!this.editModel.birthDate) {
      this.profileError = 'Birth date is required.';
      return;
    }

    this.isSavingProfile = true;
    this.profileError    = '';
    this.profileMessage  = '';

    const payload: BabyRequestDTO = {
      firstName,
      lastName,
      gender:                this.editModel.gender || this.baby.gender,
      birthDate:             this.editModel.birthDate,
      birthPlace:            this.normalizeNullable(this.editModel.birthPlace),
      birthWeight:           this.editModel.birthWeight   ?? undefined,
      birthHeight:           this.editModel.birthHeight   ?? undefined,
      gestationalAgeAtBirth: this.editModel.gestationalAgeAtBirth ?? undefined,
      bloodType:             this.normalizeNullable(this.editModel.bloodType),
      deliveryType:          this.normalizeNullable(this.editModel.deliveryType),
      notes:                 this.normalizeNullable(this.editModel.notes),
      photoUrl:              this.baby.photoUrl ?? null
    };

    this.babyService
      .updateBaby(this.babyId, payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isSavingProfile = false; })
      )
      .subscribe({
        next: (updated) => {
          this.baby           = updated;
          this.isEditMode     = false;
          this.profileMessage = 'Profile updated successfully.';
          this.syncBodyScrollLock();
        },
        error: () => {
          this.profileError = 'Unable to update profile right now.';
        }
      });
  }

  onPhotoSelected(event: Event): void {
    if (!this.baby) return;
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    this.photoError   = '';
    this.photoMessage = '';
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.photoError = 'Accepted formats: PNG, JPG, JPEG, WEBP.';
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.photoError = 'Image size must not exceed 5 MB.';
      input.value = '';
      return;
    }

    this.compressImageToDataUrl(file)
      .then((dataUrl) => {
        this.updatePhoto(dataUrl);
        input.value = '';
      })
      .catch(() => {
        this.photoError = 'Unable to process the selected image.';
        input.value = '';
      });
  }

  private updatePhoto(photoUrl: string): void {
    if (!this.baby) return;
    this.isUpdatingPhoto = true;
    this.photoError      = '';
    this.photoMessage    = '';

    const payload = this.buildUpdatePayload({ photoUrl });

    this.babyService
      .updateBaby(this.babyId, payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isUpdatingPhoto = false; })
      )
      .subscribe({
        next: (updated) => { this.baby = updated; this.photoMessage = 'Photo updated successfully.'; },
        error: (err: HttpErrorResponse) => {
          const apiMessage = typeof err?.error?.message === 'string' ? err.error.message : '';
          this.photoError = apiMessage || 'Unable to update the photo right now.';
        }
      });
  }

  private compressImageToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 600;
          const maxHeight = 600;

          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas unavailable'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };

        img.onerror = () => reject(new Error('Invalid image'));
        img.src = String(reader.result || '');
      };

      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(file);
    });
  }

  private buildUpdatePayload(overrides: Partial<BabyRequestDTO>): BabyRequestDTO {
    const b = this.baby as BabyResponseDTO;
    return {
      firstName:             overrides.firstName             ?? b.firstName,
      lastName:              overrides.lastName              ?? b.lastName,
      gender:                overrides.gender                ?? b.gender,
      birthDate:             overrides.birthDate             ?? b.birthDate,
      birthWeight:           overrides.birthWeight           ?? b.birthWeight,
      birthHeight:           overrides.birthHeight           ?? b.birthHeight,
      bloodType:             overrides.bloodType             ?? b.bloodType             ?? null,
      birthPlace:            overrides.birthPlace            ?? b.birthPlace            ?? null,
      photoUrl:              overrides.photoUrl              ?? b.photoUrl              ?? null,
      notes:                 overrides.notes                 ?? b.notes                 ?? null,
      deliveryType:          overrides.deliveryType          ?? b.deliveryType          ?? null,
      gestationalAgeAtBirth: overrides.gestationalAgeAtBirth ?? b.gestationalAgeAtBirth
    };
  }

  private normalizeNullable(value: string | null | undefined): string | null {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed || null;
  }

  private loadData(): void {
    this.loading = true;
    this.error   = '';

    forkJoin({
      baby:      this.babyService.getBabyById(this.babyId),
      dashboard: this.dashboardService.getDashboard(this.babyId).pipe(catchError(() => of(null))),
      growthRecords: this.growthRecordService.getAllGrowthRecords(this.babyId).pipe(catchError(() => of([]))),
      careScore: this.careScoreService.getCareScore(this.babyId).pipe(catchError(() => of(null))),
      growthStory: this.growthStoryService.getGrowthStory(this.babyId).pipe(catchError(() => of(null))),
      latestMilestone: this.milestoneService.getLatestMilestone(this.babyId).pipe(catchError(() => of(null))),
      timelineEvents: this.timelineService.getTimeline(this.babyId).pipe(catchError(() => of([])))
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.loading = false; })
      )
      .subscribe({
        next: ({ baby, dashboard, growthRecords, careScore, growthStory, latestMilestone, timelineEvents }) => {
          this.baby = baby;
          this.dashboard = dashboard;
          this.growthRecords = growthRecords;
          this.careScore = careScore;
          this.growthStory = growthStory;
          this.latestMilestone = latestMilestone;
          this.timelineEvents = timelineEvents;
          this.htlBuildAvailableTypes();
          this.htlApplyFilter();
          this.rebuildGrowthChart();
        },
        error: () => { this.error = 'Unable to load baby profile right now.'; }
      });
  }

  private htlBuildAvailableTypes(): void {
    const seen = new Set<string>();
    this.timelineEvents.forEach((event) => {
      const t = (event.eventType || '').toUpperCase();
      if (t) seen.add(t);
    });
    this.htlAvailableTypes = Array.from(seen);
    if (this.htlActiveType !== 'ALL' && !this.htlAvailableTypes.includes(this.htlActiveType)) {
      this.htlActiveType = 'ALL';
    }
  }

  private htlApplyFilter(): void {
    let events = [...this.timelineEvents];
    if (this.htlActiveType !== 'ALL') {
      events = events.filter((e) => (e.eventType || '').toUpperCase() === this.htlActiveType);
    }

    events.sort((a, b) => new Date(a.eventDateTime as string).getTime() - new Date(b.eventDateTime as string).getTime());
    this.htlFiltered = events;
  }


private rebuildGrowthChart(): void {
  const rawSeries = this.buildMetricSeries(this.chartMetric);
  this.chartColor = this.getMetricColor(this.chartMetric);
  this.chartMetricTitle = this.chartMetric.toUpperCase();

  if (rawSeries.length === 0) {
    this.chartSeries = [];
    this.chartLinePoints = '';
    this.chartAreaPoints = '';
    this.chartXAxisLabels = [];
    this.chartYAxisTicks = [];
    return;
  }

  const timestamps = rawSeries.map((item) => item.date.getTime());
  const values = rawSeries.map((item) => item.value);

  const minTs = this.getBirthTimestamp(rawSeries, timestamps);
  const maxTs = this.getTodayTimestamp(timestamps);

  const axisMinValue = this.getMetricAxisMinimum(this.chartMetric);
  const maxValue = Math.max(...values);
  const safeMinValue = axisMinValue > 0 ? axisMinValue : Math.min(...values);

  const high = maxValue <= safeMinValue
    ? safeMinValue + this.getMetricAxisPadding(this.chartMetric)
    : maxValue + this.getMetricAxisPadding(this.chartMetric);

  const valueRange = Math.max(0.1, high - safeMinValue);
  const rangeTs = Math.max(1, maxTs - minTs);

  const plotLeft = 8;
  const plotRight = 96;
  const plotTop = 8;
  const plotBottom = 82;

  this.chartSeries = rawSeries.map((item) => {
    const x = plotLeft + ((item.value - safeMinValue) / valueRange) * (plotRight - plotLeft);
    const ratio = (item.date.getTime() - minTs) / rangeTs;
    const y = plotBottom - (ratio * (plotBottom - plotTop));

    return {
      x,
      y,
      value: item.value,
      label: item.label
    };
  });

  this.chartLinePoints = this.chartSeries.map((point) => `${point.x},${point.y}`).join(' ');

  const firstPoint = this.chartSeries[0];
  const lastPoint = this.chartSeries[this.chartSeries.length - 1];

  this.chartAreaPoints = [
    this.chartLinePoints,
    `${lastPoint.x},82`,
    `${firstPoint.x},82`
  ].join(' ');

  this.chartXAxisLabels = this.buildXAxisLabels(safeMinValue, high, this.chartMetric);
  this.chartYAxisTicks = this.buildDateYAxisTicks(minTs, maxTs, plotTop, plotBottom);
}

private buildDateYAxisTicks(minTs: number, maxTs: number, plotTop: number, plotBottom: number): AxisTick[] {
  const ticks: AxisTick[] = [];
  const steps = 4;

  for (let i = 0; i <= steps; i += 1) {
    const ratio = i / steps;
    const timestamp = minTs + ((maxTs - minTs) * ratio);
    const y = plotBottom - (ratio * (plotBottom - plotTop));

    ticks.push({
      y,
      label: this.formatDateAxisLabel(new Date(timestamp))
    });
  }

  return ticks;
}

  private buildMetricSeries(metric: GrowthMetric): Array<{ date: Date; value: number; label: string }> {
    const series: Array<{ date: Date; value: number; label: string }> = [];

    if (this.baby?.birthDate) {
      const birthDate = new Date(this.baby.birthDate);
      const birthValue =
        metric === 'weight'
          ? this.baby.birthWeight
          : metric === 'height'
            ? this.baby.birthHeight
            : this.calculateBirthBmi();

      if (!Number.isNaN(birthDate.getTime()) && birthValue && Number.isFinite(birthValue)) {
        series.push({
          date: birthDate,
          value: birthValue,
          label: `Birth: ${birthValue.toFixed(metric === 'bmi' ? 1 : 1)} ${this.metricUnit(metric)}`
        });
      }
    }

    this.growthRecords.forEach((record) => {
      const date = new Date(record.recordDate);
      if (Number.isNaN(date.getTime())) {
        return;
      }

      const value = metric === 'weight' ? record.weight : metric === 'height' ? record.height : record.bmi;
      if (!Number.isFinite(value)) {
        return;
      }

      series.push({
        date,
        value,
        label: `${date.toLocaleDateString()}: ${value.toFixed(metric === 'bmi' ? 1 : 1)} ${this.metricUnit(metric)}`
      });
    });

    series.sort((a, b) => a.date.getTime() - b.date.getTime());
    return series;
  }

  private getMetricAxisMinimum(metric: GrowthMetric): number {
    if (!this.baby) {
      return 0;
    }

    if (metric === 'height') {
      return this.baby.birthHeight ?? 0;
    }

    if (metric === 'weight') {
      return this.baby.birthWeight ?? 0;
    }

    return this.calculateBirthBmi() ?? 0;
  }

  private getMetricAxisPadding(metric: GrowthMetric): number {
    if (metric === 'height') {
      return 3;
    }
    if (metric === 'bmi') {
      return 1;
    }
    return 0.5;
  }

  private getBirthTimestamp(
    rawSeries: Array<{ date: Date; value: number; label: string }>,
    timestamps: number[]
  ): number {
    const allTimestamps = [...timestamps];

    if (this.baby?.birthDate) {
      const birthTs = new Date(this.baby.birthDate).getTime();
      if (!Number.isNaN(birthTs)) {
        allTimestamps.push(birthTs);
      }
    }

    return Math.min(...allTimestamps, rawSeries[0].date.getTime());
  }

  private getTodayTimestamp(timestamps: number[]): number {
    const today = new Date();
    const todayTs = today.getTime();
    if (Number.isNaN(todayTs)) {
      return Math.max(...timestamps);
    }
    return Math.max(todayTs, ...timestamps);
  }


  private calculateBirthBmi(): number | null {
    const birthWeight = this.baby?.birthWeight;
    const birthHeight = this.baby?.birthHeight;

    if (!birthWeight || !birthHeight) {
      return null;
    }

    const heightMeters = birthHeight / 100;
    if (!heightMeters) {
      return null;
    }

    return Number((birthWeight / (heightMeters * heightMeters)).toFixed(1));
  }

  private buildXAxisLabels(minValue: number, maxValue: number, metric: GrowthMetric): XAxisLabel[] {
    const steps = 5;
    const range = Math.max(0.1, maxValue - minValue);
    const plotLeft = 8;
    const plotRight = 96;

    return Array.from({ length: steps + 1 }, (_, index) => {
      const value = minValue + (range * index) / steps;
      const ratio = index / steps;
      const left = plotLeft + ratio * (plotRight - plotLeft);

      return {
        left,
        label: this.formatMetricValue(value, metric)
      };
    });
  }

  private formatDateAxisLabel(date: Date): string {
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString('en-CA');
  }

  private formatMetricValue(value: number, metric: GrowthMetric): string {
    if (metric === 'height') {
      return `${value.toFixed(1)} cm`;
    }
    if (metric === 'bmi') {
      return value.toFixed(2);
    }
    return `${value.toFixed(1)} kg`;
  }

  private getMetricColor(metric: GrowthMetric): string {
    if (metric === 'height') {
      return '#2563eb';
    }
    if (metric === 'bmi') {
      return '#059669';
    }
    return '#f43f5e';
  }

  private syncBodyScrollLock(): void {
    this.document.body.style.overflow = (this.isEditMode || this.isCareScoreModalOpen || this.isTodaySummaryModalOpen || this.isUpcomingHealthModalOpen || this.isHtlEventModalOpen) ? 'hidden' : '';
  }
}