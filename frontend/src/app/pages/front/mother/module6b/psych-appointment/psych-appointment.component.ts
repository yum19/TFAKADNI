import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import {
  PsychAppointmentRequestDto,
  PsychAppointmentResponseDto,
  PsychAppointmentService
} from '../../../../../core/services/module6b/psych-appointment.service';

import {
  PredictionResultResponseDto,
  PredictionResultService
} from '../../../../../core/services/module6b/prediction-result.service';

type AppointmentStatusFilter = 'ALL' | 'PLANNED' | 'COMPLETED' | 'CANCELLED';
type AppointmentTypeFilter = 'ALL' | 'IN_PERSON' | 'ONLINE' | 'PHONE' | 'FOLLOW_UP';
type ToastType = 'success' | 'error' | 'info';

interface CalendarDay {
  date: Date;
  isoDate: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isPastDay: boolean;
  appointments: PsychAppointmentResponseDto[];
}

interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

@Component({
  selector: 'app-psych-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink],
  templateUrl: './psych-appointment.component.html',
  styleUrls: ['./psych-appointment.component.css']
})
export class PsychAppointmentComponent implements OnInit {
  appointments: PsychAppointmentResponseDto[] = [];
  filteredAppointments: PsychAppointmentResponseDto[] = [];
  predictionResults: PredictionResultResponseDto[] = [];
  calendarDays: CalendarDay[] = [];
  toasts: ToastMessage[] = [];

  loading = false;
  saving = false;
  loadingPredictions = false;

  errorMessage = '';
  successMessage = '';

  selectedStatus: AppointmentStatusFilter = 'ALL';
  selectedType: AppointmentTypeFilter = 'ALL';
  searchTerm = '';

  editingAppointmentId: number | null = null;
  currentMonthDate = new Date();

  isModalOpen = false;
  selectedCalendarDate = '';

  form: PsychAppointmentRequestDto = {
    predictionResultId: undefined,
    psychologistName: '',
    appointmentDate: '',
    type: 'IN_PERSON',
    status: 'PLANNED',
    location: '',
    notes: ''
  };

  constructor(
    private psychAppointmentService: PsychAppointmentService,
    private predictionResultService: PredictionResultService
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
    this.loadPredictionResults();
  }

  loadAppointments(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.psychAppointmentService.getAppointmentsByMother().subscribe({
      next: (data) => {
        this.appointments = [...(data ?? [])].sort(
          (a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
        );
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Load appointments error:', error);
        this.loading = false;
        this.errorMessage =
          error?.error?.message ||
          error?.error ||
          error?.message ||
          'Unable to load psychological appointments right now.';
        this.showToast(this.errorMessage, 'error');
      }
    });
  }

  loadPredictionResults(): void {
    this.loadingPredictions = true;

    this.predictionResultService.getPredictionsByMother().subscribe({
      next: (data) => {
        this.predictionResults = [...(data ?? [])].sort(
          (a, b) => new Date(b.predictionDate).getTime() - new Date(a.predictionDate).getTime()
        );
        this.loadingPredictions = false;
      },
      error: (error) => {
        console.error('Load prediction results error:', error);
        this.loadingPredictions = false;
        this.showToast('Unable to load prediction results.', 'error');
      }
    });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredAppointments = this.appointments.filter((item) => {
      const matchesStatus =
        this.selectedStatus === 'ALL' || (item.status || '').toUpperCase() === this.selectedStatus;

      const matchesType =
        this.selectedType === 'ALL' || (item.type || '').toUpperCase() === this.selectedType;

      const searchable = [
        item.psychologistName || '',
        item.location || '',
        item.notes || '',
        item.status || '',
        item.type || '',
        item.predictionResultId ? `prediction ${item.predictionResultId}` : ''
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !search || searchable.includes(search);

      return matchesStatus && matchesType && matchesSearch;
    });

    this.buildCalendar();
  }

  clearFilters(): void {
    this.selectedStatus = 'ALL';
    this.selectedType = 'ALL';
    this.searchTerm = '';
    this.applyFilters();
    this.showToast('Filters reset successfully.', 'info');
  }

  openCreateModal(date?: Date): void {
    this.resetForm();

    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const clickedDate = new Date(date);
      clickedDate.setHours(0, 0, 0, 0);

      if (clickedDate < today) {
        this.errorMessage = 'You cannot create an appointment in a past date.';
        this.showToast(this.errorMessage, 'error');
        return;
      }

      this.selectedCalendarDate = this.toDateOnly(date);
      const defaultDate = new Date(date);
      defaultDate.setHours(9, 0, 0, 0);
      this.form.appointmentDate = this.toDatetimeLocalValue(defaultDate.toISOString());
    } else {
      this.selectedCalendarDate = '';
    }

    this.isModalOpen = true;
  }

  openEditModal(appointment: PsychAppointmentResponseDto): void {
    this.editingAppointmentId = appointment.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.form = {
      predictionResultId: appointment.predictionResultId,
      psychologistName: appointment.psychologistName || '',
      appointmentDate: this.toDatetimeLocalValue(appointment.appointmentDate),
      type: appointment.type || 'IN_PERSON',
      status: appointment.status || 'PLANNED',
      location: appointment.location || '',
      notes: appointment.notes || ''
    };

    this.selectedCalendarDate = this.toDateOnly(new Date(appointment.appointmentDate));
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.resetForm();
  }

  submitForm(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.form.appointmentDate) {
      this.errorMessage = 'Appointment date is required.';
      this.showToast(this.errorMessage, 'error');
      return;
    }

    const selectedDate = new Date(this.form.appointmentDate);
    const now = new Date();

    if (selectedDate.getTime() < now.getTime()) {
      this.errorMessage = 'You cannot create or modify an appointment in the past.';
      this.showToast(this.errorMessage, 'error');
      return;
    }

    this.saving = true;

    const payload: PsychAppointmentRequestDto = {
      predictionResultId: this.toOptionalNumber(this.form.predictionResultId),
      psychologistName: (this.form.psychologistName || '').trim(),
      appointmentDate: this.toIsoDateTime(this.form.appointmentDate),
      type: (this.form.type || 'IN_PERSON').trim(),
      status: this.editingAppointmentId
        ? (this.form.status || 'PLANNED').trim()
        : 'PLANNED',
      location: (this.form.location || '').trim(),
      notes: (this.form.notes || '').trim()
    };

    const request$ = this.editingAppointmentId
      ? this.psychAppointmentService.updateAppointment(this.editingAppointmentId, payload)
      : this.psychAppointmentService.createAppointment(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = this.editingAppointmentId
          ? 'Appointment updated successfully.'
          : 'Appointment created successfully.';

        this.showToast(this.successMessage, 'success');
        this.closeModal();
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Save appointment error:', error);
        this.saving = false;
        this.errorMessage =
          error?.error?.message ||
          error?.error ||
          error?.message ||
          'Unable to save this appointment right now.';
        this.showToast(this.errorMessage, 'error');
      }
    });
  }

  deleteAppointment(id: number, event?: Event): void {
    event?.stopPropagation();

    const confirmed = window.confirm('Do you want to delete this appointment?');
    if (!confirmed) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.psychAppointmentService.deleteAppointment(id).subscribe({
      next: () => {
        this.successMessage = 'Appointment deleted successfully.';
        this.showToast(this.successMessage, 'success');
        this.loadAppointments();
      },
      error: (error) => {
        console.error('Delete appointment error:', error);
        this.errorMessage =
          error?.error?.message ||
          error?.error ||
          error?.message ||
          'Unable to delete this appointment right now.';
        this.showToast(this.errorMessage, 'error');
      }
    });
  }

  resetForm(): void {
    this.editingAppointmentId = null;
    this.form = {
      predictionResultId: undefined,
      psychologistName: '',
      appointmentDate: '',
      type: 'IN_PERSON',
      status: 'PLANNED',
      location: '',
      notes: ''
    };
  }

  onStatusFilterChange(status: AppointmentStatusFilter): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  onTypeFilterChange(type: AppointmentTypeFilter): void {
    this.selectedType = type;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  previousMonth(): void {
    this.currentMonthDate = new Date(
      this.currentMonthDate.getFullYear(),
      this.currentMonthDate.getMonth() - 1,
      1
    );
    this.buildCalendar();
  }

  nextMonth(): void {
    this.currentMonthDate = new Date(
      this.currentMonthDate.getFullYear(),
      this.currentMonthDate.getMonth() + 1,
      1
    );
    this.buildCalendar();
  }

  goToToday(): void {
    this.currentMonthDate = new Date();
    this.buildCalendar();
  }

  buildCalendar(): void {
    const year = this.currentMonthDate.getFullYear();
    const month = this.currentMonthDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDay = firstDayOfMonth.getDay();
    const calendarStart = new Date(year, month, 1 - startDay);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(calendarStart);
      date.setDate(calendarStart.getDate() + i);

      const isoDate = this.toDateOnly(date);
      const dayAppointments = this.filteredAppointments.filter(
        item => this.toDateOnly(new Date(item.appointmentDate)) === isoDate
      );

      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);

      days.push({
        date,
        isoDate,
        inCurrentMonth: date.getMonth() === month,
        isToday: isoDate === this.toDateOnly(new Date()),
        isPastDay: normalizedDate.getTime() < today.getTime(),
        appointments: dayAppointments
      });
    }

    this.calendarDays = days;
  }

  get monthLabel(): string {
    return this.currentMonthDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }

  get upcomingAppointments(): PsychAppointmentResponseDto[] {
    const now = new Date().getTime();
    return this.filteredAppointments
      .filter(item => new Date(item.appointmentDate).getTime() >= now)
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
  }

  get pastAppointments(): PsychAppointmentResponseDto[] {
    const now = new Date().getTime();
    return this.filteredAppointments
      .filter(item => new Date(item.appointmentDate).getTime() < now)
      .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
  }

  get plannedCount(): number {
    return this.filteredAppointments.filter(item => (item.status || '').toUpperCase() === 'PLANNED').length;
  }

  get completedCount(): number {
    return this.filteredAppointments.filter(item => (item.status || '').toUpperCase() === 'COMPLETED').length;
  }

  get cancelledCount(): number {
    return this.filteredAppointments.filter(item => (item.status || '').toUpperCase() === 'CANCELLED').length;
  }

  get totalCount(): number {
    return this.filteredAppointments.length;
  }

  getStatusClass(status: string | undefined): string {
    const value = (status || '').toUpperCase();

    if (value === 'PLANNED') return 'status-planned';
    if (value === 'COMPLETED') return 'status-completed';
    if (value === 'CANCELLED') return 'status-cancelled';
    return 'status-default';
  }

  getTypeLabel(type: string | undefined): string {
    const value = (type || '').replace(/_/g, ' ').trim();
    return value || 'Not specified';
  }

  formatAppointmentDate(value: string): string {
    return new Date(value).toLocaleString();
  }

  trackByAppointmentId(index: number, item: PsychAppointmentResponseDto): number {
    return item.id;
  }

  getPredictionLabel(item: PredictionResultResponseDto): string {
    const datePart = item.predictionDate
      ? new Date(item.predictionDate).toLocaleDateString()
      : 'No date';

    const resultPart = item.riskLevel || 'No result';

    return `#${item.id} - ${datePart} - ${resultPart}`;
  }

  onDayClick(day: CalendarDay): void {
    if (day.isPastDay) {
      this.errorMessage = 'You cannot create an appointment in a past date.';
      this.showToast(this.errorMessage, 'error');
      return;
    }

    this.openCreateModal(day.date);
  }

  onAppointmentEdit(appointment: PsychAppointmentResponseDto, event?: Event): void {
    event?.stopPropagation();
    this.openEditModal(appointment);
  }

  getMinDateTime(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  }

  showToast(text: string, type: ToastType = 'info'): void {
    const toast: ToastMessage = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      text,
      type
    };

    this.toasts = [...this.toasts, toast];

    setTimeout(() => {
      this.toasts = this.toasts.filter(item => item.id !== toast.id);
    }, 3500);
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter(item => item.id !== id);
  }

  private toOptionalNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private toIsoDateTime(value: string): string {
    return new Date(value).toISOString();
  }

  private toDatetimeLocalValue(value: string): string {
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  }

  private toDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}