import { CommonModule, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ReminderRequestDTO,
  ReminderResponseDTO,
  ReminderService,
  ReminderStatus,
  ReminderType
} from '../../../../../core/services/module6a/reminder.service';

type ReminderFilter = 'ALL' | ReminderType;

interface DayGroup {
  date: string;
  label: string;
  reminders: ReminderResponseDTO[];
}

@Component({
  selector: 'app-reminder',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, NgClass, DatePipe, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reminder.component.html',
  styleUrls: ['./reminder.component.css']
})
export class ReminderComponent implements OnInit {
  babyId = 0;
  reminders: ReminderResponseDTO[] = [];
  filteredReminders: ReminderResponseDTO[] = [];
  groupedReminders: DayGroup[] = [];

  searchTerm = '';
  pageSize = 6;
  currentPage = 1;
  totalFilteredCount = 0;

  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';

  reminderTypes: ReminderType[] = ['VACCINE', 'APPOINTMENT', 'CUSTOM'];
  reminderStatuses: ReminderStatus[] = ['PENDING', 'SENT', 'DISMISSED'];

  reminderForm!: FormGroup;

  inlineEditReminderId: number | null = null;
  inlineForm!: FormGroup;
  inlineSubmitting = false;

  showAddModal = false;
  editingReminderId: number | null = null;

  selectedDays = 30;
  activeType: ReminderFilter = 'ALL';

  get pendingCount(): number {
    return this.reminders.filter(r => r.status === 'PENDING').length;
  }

  get sentCount(): number {
    return this.reminders.filter(r => r.status === 'SENT').length;
  }

  get overdueCount(): number {
    return this.reminders.filter(r => this.isOverdue(r)).length;
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly reminderService: ReminderService
  ) {}

  ngOnInit(): void {
    this.babyId = Number(this.route.snapshot.paramMap.get('babyId')) || 0;
    this.initForm();
    this.loadReminders();
  }

  openAddModal(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.editingReminderId = null;
    this.reminderForm.reset({
      type: 'CUSTOM',
      reminderDate: '',
      message: '',
    });
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.editingReminderId = null;
  }

  initForm(): void {
    this.reminderForm = this.fb.group({
      type: ['CUSTOM', Validators.required],
      reminderDate: ['', Validators.required],
      message: ['', [Validators.required, Validators.maxLength(500)]]
    });

    this.inlineForm = this.fb.group({
      type: ['CUSTOM', Validators.required],
      reminderDate: ['', Validators.required],
      message: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  loadReminders(): void {
    this.loading = true;
    this.errorMessage = '';

    this.inlineEditReminderId = null;
    this.currentPage = 1;

    this.reminderService.getAllRemindersByBaby(this.babyId).subscribe({
      next: (data) => {
        this.reminders = data ?? [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Error loading reminders.';
        this.loading = false;
      }
    });
  }

  setDays(days: number): void {
    this.selectedDays = days;
    this.resetPagination();
    this.applyFilters();
  }

  setType(type: ReminderFilter): void {
    this.activeType = type;
    this.resetPagination();
    this.applyFilters();
  }

  onSearchChange(): void {
    this.resetPagination();
    this.applyFilters();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalFilteredCount / this.pageSize));
  }

  get hasPagination(): boolean {
    return this.totalFilteredCount > this.pageSize;
  }

  prevPage(): void {
    this.currentPage = Math.max(1, this.currentPage - 1);
    this.applyFilters();
  }

  nextPage(): void {
    this.currentPage = Math.min(this.totalPages, this.currentPage + 1);
    this.applyFilters();
  }

  private resetPagination(): void {
    this.currentPage = 1;
  }

  applyFilters(): void {
    let items = [...this.reminders];

    if (this.activeType !== 'ALL') {
      items = items.filter(r => r.type === this.activeType);
    }

    if (this.selectedDays > 0) {
      const cutoff = Date.now() - this.selectedDays * 86400000;
      items = items.filter(r => this.parseReminderDateTime(r).getTime() >= cutoff);
    }

    const term = (this.searchTerm || '').trim().toLowerCase();
    if (term) {
      items = items.filter(r => {
        const message = (r.message || '').toLowerCase();
        const type = (r.type || '').toLowerCase();
        return message.includes(term) || type.includes(term);
      });
    }

    items.sort((a, b) => this.parseReminderDateTime(b).getTime() - this.parseReminderDateTime(a).getTime());
    this.totalFilteredCount = items.length;

    const totalPages = this.totalPages;
    this.currentPage = Math.min(Math.max(1, this.currentPage), totalPages);

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.filteredReminders = items.slice(start, end);

    this.buildGroups(this.filteredReminders);
  }

  private buildGroups(reminders: ReminderResponseDTO[]): void {
    const map = new Map<string, ReminderResponseDTO[]>();

    for (const reminder of reminders) {
      const key = this.toDateKey(this.parseReminderDateTime(reminder));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(reminder);
    }

    const today = this.toDateKey(new Date());
    const yesterday = this.toDateKey(new Date(Date.now() - 86400000));

    this.groupedReminders = Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, reminders]) => ({
        date,
        label: date === today ? 'Today' : date === yesterday ? 'Yesterday' : this.formatDate(date),
        reminders
      }));
  }

  private toDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formatDate(key: string): string {
    const d = new Date(key + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  parseReminderDateTime(reminder: ReminderResponseDTO): Date {
    const raw = reminder.reminderDate || reminder.createdAt;
    if (!raw) return new Date(0);
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(`${raw}T00:00:00`);
    return new Date(raw);
  }

  isOverdue(reminder: ReminderResponseDTO): boolean {
    if (typeof reminder.overdue === 'boolean') {
      return reminder.overdue;
    }
    return reminder.status === 'PENDING' && this.parseReminderDateTime(reminder).getTime() < Date.now();
  }

  isManualReminder(reminder: ReminderResponseDTO): boolean {
    return (reminder.sourceType || '').toUpperCase() === 'MANUAL';
  }

  isAutoReminder(reminder: ReminderResponseDTO): boolean {
    return !this.isManualReminder(reminder);
  }

  canMarkSent(reminder: ReminderResponseDTO): boolean {
    return reminder.status === 'PENDING';
  }

  canDismiss(reminder: ReminderResponseDTO): boolean {
    return reminder.status === 'PENDING';
  }

  canDelete(reminder: ReminderResponseDTO): boolean {
    return this.isManualReminder(reminder);
  }

  canEdit(reminder: ReminderResponseDTO): boolean {
    return this.isManualReminder(reminder);
  }

  isInlineEditing(reminder: ReminderResponseDTO): boolean {
    return this.inlineEditReminderId === reminder.id;
  }

  onCardUpdate(reminder: ReminderResponseDTO): void {
    if (!this.canEdit(reminder)) return;
    if (this.inlineSubmitting) return;

    this.successMessage = '';
    this.errorMessage = '';

    if (!this.isInlineEditing(reminder)) {
      this.inlineEditReminderId = reminder.id;
      this.inlineForm.reset({
        type: reminder.type,
        reminderDate: this.toDatetimeLocalValue(reminder.reminderDate),
        message: reminder.message
      });
      return;
    }

    if (this.inlineForm.invalid) {
      this.inlineForm.markAllAsTouched();
      return;
    }

    this.inlineSubmitting = true;
    const formValue = this.inlineForm.value;
    const payload: ReminderRequestDTO = {
      type: formValue.type,
      reminderDate: formValue.reminderDate,
      message: (formValue.message || '').trim(),
      status: 'PENDING'
    };

    this.reminderService.updateReminder(this.babyId, reminder.id, payload).subscribe({
      next: (updated) => {
        this.successMessage = 'Reminder updated successfully.';
        this.reminders = this.reminders.map(r => (r.id === updated.id ? updated : r));
        this.inlineEditReminderId = null;
        this.inlineSubmitting = false;
        this.applyFilters();
      },
      error: () => {
        this.errorMessage = 'Error saving reminder.';
        this.inlineSubmitting = false;
      }
    });
  }

  editReminder(reminder: ReminderResponseDTO): void {
    if (!this.canEdit(reminder)) return;

    this.successMessage = '';
    this.errorMessage = '';
    this.editingReminderId = reminder.id;

    this.reminderForm.patchValue({
      type: reminder.type,
      reminderDate: this.toDatetimeLocalValue(reminder.reminderDate),
      message: reminder.message
    });

    this.showAddModal = true;
  }

  private toDatetimeLocalValue(value?: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  getSourceRoute(reminder: ReminderResponseDTO): (string | number)[] | null {
    const sourceType = (reminder.sourceType || '').toUpperCase();

    if (sourceType === 'VACCINE') {
      return ['/mother/babies', this.babyId, 'vaccines'];
    }

    if (sourceType === 'APPOINTMENT') {
      return ['/mother/babies', this.babyId, 'appointments'];
    }

    return null;
  }

  getSourceLabel(reminder: ReminderResponseDTO): string {
    const sourceType = (reminder.sourceType || '').toUpperCase();

    if (sourceType === 'VACCINE') return 'Open vaccine';
    if (sourceType === 'APPOINTMENT') return 'Open appointment';
    return 'Open source';
  }

  formatPriority(reminder: ReminderResponseDTO): string {
    if (this.isOverdue(reminder)) return '⚠ Overdue';
    if (reminder.status === 'PENDING') return '⚡ Pending';
    if (reminder.status === 'SENT') return '✓ Sent';
    return '· Normal';
  }

  priorityClass(reminder: ReminderResponseDTO): string {
    if (this.isOverdue(reminder)) return 'pri-overdue';
    if (reminder.status === 'PENDING') return 'pri-important';
    return 'pri-normal';
  }

  getIcon(type?: string): string {
    switch ((type || '').toUpperCase()) {
      case 'VACCINE':     return '💉';
      case 'APPOINTMENT': return '🩺';
      case 'GROWTH':      return '📏';
      case 'CUSTOM':      return '🔔';
      default:            return '🔔';
    }
  }

  getTypeBadgeClass(reminder: ReminderResponseDTO): string {
    const type = (reminder.type || '').toUpperCase();
    if (type === 'VACCINE') return 'badge-vaccine';
    if (type === 'APPOINTMENT') return 'badge-appointment';
    return 'badge-reminder';
  }

  getStatusClass(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'PENDING': return 'st-pending';
      case 'SENT': return 'st-sent';
      case 'DISMISSED': return 'st-dismissed';
      default: return 'st-unknown';
    }
  }

  trackByDate(index: number, group: DayGroup): string {
    return group.date;
  }

  onSubmit(): void {
    if (this.reminderForm.invalid) {
      this.reminderForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.reminderForm.value;
    const payload: ReminderRequestDTO = {
      type: formValue.type,
      reminderDate: formValue.reminderDate,
      message: formValue.message.trim(),
      status: 'PENDING'
    };

    const request$ = this.editingReminderId
      ? this.reminderService.updateReminder(this.babyId, this.editingReminderId, payload)
      : this.reminderService.createReminder(this.babyId, payload);

    request$.subscribe({
      next: () => {
        this.successMessage = this.editingReminderId
          ? 'Reminder updated successfully.'
          : 'Reminder created successfully.';

        this.reminderForm.reset({
          type: 'CUSTOM',
          reminderDate: '',
          message: '',
        });

        this.editingReminderId = null;
        this.loadReminders();
        this.submitting = false;
        this.closeAddModal();
      },
      error: () => {
        this.errorMessage = 'Error saving reminder.';
        this.submitting = false;
      }
    });
  }

  deleteReminder(reminderId: number): void {
    const confirmed = window.confirm('Are you sure you want to delete this reminder?');
    if (!confirmed) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.reminderService.deleteReminder(this.babyId, reminderId).subscribe({
      next: () => {
        this.successMessage = 'Reminder deleted successfully.';
        this.loadReminders();
      },
      error: () => {
        this.errorMessage = 'Error deleting reminder.';
      }
    });
  }

  updateStatus(reminderId: number, status: ReminderStatus): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.reminderService.updateReminderStatus(this.babyId, reminderId, status).subscribe({
      next: () => {
        this.successMessage = 'Reminder status updated successfully.';
        this.loadReminders();
      },
      error: () => {
        this.errorMessage = 'Error updating reminder status.';
      }
    });
  }

  trackByReminderId(index: number, reminder: ReminderResponseDTO): number {
    return reminder.id;
  }
}