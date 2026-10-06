import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
  FormsModule
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  BabyAppointmentRequestDTO,
  BabyAppointmentResponseDTO,
  AppointmentService,
  AppointmentType,
  AppointmentStatus
} from '../../../../../core/services/module6a/appointment.service';

type DisplayAppointmentStatus = 'PLANNED' | 'DONE' | 'CANCELLED' | 'MISSED';
type StatusAction = 'DONE' | 'CANCELLED';

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.css']
})
export class AppointmentComponent implements OnInit {
  babyId!: number;

  appointments: BabyAppointmentResponseDTO[] = [];
  loading = false;
  submitting = false;
  isEditMode = false;
  selectedAppointmentId: number | null = null;
  focusedAppointmentId: number | null = null;
  errorMessage = '';
  successMessage = '';

  currentWeekStart!: Date;
  weekDays: Date[] = [];
  showModal = false;

  showStatusModal = false;
  modalTargetAppointment: BabyAppointmentResponseDTO | null = null;
  selectedStatusAction: StatusAction | null = null;
  statusSubmitting = false;
  statusNotes = '';

  appointmentTypes: AppointmentType[] = ['PEDIATRE', 'CONTROLE', 'URGENCE', 'AUTRE'];

  appointmentForm!: FormGroup;

  calendarHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.initWeek(new Date());

    const babyIdParam = this.route.snapshot.paramMap.get('babyId');
    this.babyId = babyIdParam ? +babyIdParam : 1;

    this.loadAppointments();
  }

  initForm(): void {
    this.appointmentForm = this.fb.group(
      {
        appointmentDate: ['', Validators.required],
        appointmentTime: ['10:00', Validators.required],
        doctorName: ['', [Validators.required, Validators.maxLength(100)]],
        type: ['', Validators.required],
        location: ['', Validators.maxLength(200)],
        reminderDate: [''],
        notes: ['', Validators.maxLength(1000)]
      },
      { validators: this.appointmentFormValidator() }
    );
  }

  appointmentFormValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const form = control as FormGroup;

      const appointmentDate = form.get('appointmentDate')?.value;
      const appointmentTime = form.get('appointmentTime')?.value || '10:00';
      const reminderDate = form.get('reminderDate')?.value;
      const doctorName = (form.get('doctorName')?.value || '').trim();

      const errors: Record<string, boolean> = {};

      if (appointmentDate) {
        const today = this.todayDateString();
        if (appointmentDate < today) {
          errors['appointmentBeforeToday'] = true;
        }
      }

      if (appointmentDate && reminderDate) {
        const appointmentDateTime = `${appointmentDate}T${appointmentTime}:00`;
        const reminderDateTime = `${reminderDate}T09:00:00`;

        if (reminderDateTime > appointmentDateTime) {
          errors['reminderAfterAppointment'] = true;
        }
      }

      if (!doctorName && form.get('doctorName')?.touched) {
        errors['doctorNameBlank'] = true;
      }

      return Object.keys(errors).length ? errors : null;
    };
  }

  // ──────────────────────────────────────────────────────────────────────
  // Week Navigation
  // ──────────────────────────────────────────────────────────────────────

  initWeek(date: Date): void {
    const base = new Date(date);
    const day = base.getDay();
    const diff = base.getDate() - day + (day === 0 ? -6 : 1);
    this.currentWeekStart = new Date(base.setDate(diff));
    this.currentWeekStart.setHours(0, 0, 0, 0);
    this.buildWeekDays();
  }

  buildWeekDays(): void {
    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(this.currentWeekStart);
      d.setDate(d.getDate() + i);
      this.weekDays.push(d);
    }
  }

  prevWeek(): void {
    const d = new Date(this.currentWeekStart);
    d.setDate(d.getDate() - 7);
    this.currentWeekStart = d;
    this.buildWeekDays();
  }

  nextWeek(): void {
    const d = new Date(this.currentWeekStart);
    d.setDate(d.getDate() + 7);
    this.currentWeekStart = d;
    this.buildWeekDays();
  }

  goToday(): void {
    this.initWeek(new Date());
  }

  getWeekRangeLabel(): string {
    const end = new Date(this.currentWeekStart);
    end.setDate(end.getDate() + 6);

    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

    return `${this.currentWeekStart.toLocaleDateString('en-GB', opts)} – ${end.toLocaleDateString('en-GB', {
      ...opts,
      year: 'numeric'
    })}`;
  }

  getDayName(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  getDayNumber(date: Date): number {
    return date.getDate();
  }

  isToday(date: Date): boolean {
    return this.toDateOnlyString(date) === this.todayDateString();
  }

  isPastDay(date: Date): boolean {
    return this.toDateOnlyString(date) < this.todayDateString();
  }

  // ──────────────────────────────────────────────────────────────────────
  // Data
  // ──────────────────────────────────────────────────────────────────────

  loadAppointments(): void {
    this.loading = true;
    this.errorMessage = '';

    this.appointmentService.getAllAppointmentsByBaby(this.babyId).subscribe({
      next: (data) => {
        this.appointments = [...data].sort(
          (a, b) =>
            new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
        );
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = this.extractErrorMessage(error, 'Error loading appointments.');
        this.loading = false;
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // Calendar Helpers
  // ──────────────────────────────────────────────────────────────────────

  getAppointmentsForDayAndHour(date: Date, hour: number): BabyAppointmentResponseDTO[] {
    return this.appointments
      .filter((a) => {
        const apptDate = new Date(a.appointmentDate);
        return (
          apptDate.toDateString() === date.toDateString() &&
          apptDate.getHours() === hour
        );
      })
      .sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
      );
  }

  getAppointmentsForDay(date: Date): BabyAppointmentResponseDTO[] {
    return this.appointments.filter((a) => {
      const apptDate = new Date(a.appointmentDate);
      return apptDate.toDateString() === date.toDateString();
    });
  }

  hasAppointmentsOnDay(date: Date): boolean {
    return this.getAppointmentsForDay(date).length > 0;
  }

  formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  formatAppointmentTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  // ──────────────────────────────────────────────────────────────────────
  // Status Logic
  // ──────────────────────────────────────────────────────────────────────

  getDisplayStatus(appointment: BabyAppointmentResponseDTO): DisplayAppointmentStatus {
    if (appointment.status === 'DONE') return 'DONE';
    if (appointment.status === 'CANCELLED') return 'CANCELLED';
    if (appointment.status === 'MISSED') return 'MISSED';

    const appointmentDay = appointment.appointmentDate.split('T')[0];
    if (appointment.status === 'PLANNED' && appointmentDay < this.todayDateString()) {
      return 'MISSED';
    }

    return 'PLANNED';
  }

  getVisibleStatusLabel(appointment: BabyAppointmentResponseDTO): string {
    const status = this.getDisplayStatus(appointment);

    switch (status) {
      case 'DONE':
        return 'Done';
      case 'CANCELLED':
        return 'Cancelled';
      case 'MISSED':
        return 'Missed';
      default:
        return 'Planned';
    }
  }

  getStatusClass(status: AppointmentStatus | DisplayAppointmentStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  getStatusClassByAppointment(appointment: BabyAppointmentResponseDTO): string {
    return this.getStatusClass(this.getDisplayStatus(appointment));
  }

  canChangeStatus(appointment: BabyAppointmentResponseDTO): boolean {
    const displayStatus = this.getDisplayStatus(appointment);
    return displayStatus === 'PLANNED' || displayStatus === 'CANCELLED';
  }

  canUpdateAppointment(appointment: BabyAppointmentResponseDTO): boolean {
    const displayStatus = this.getDisplayStatus(appointment);
    return (
      displayStatus === 'PLANNED' ||
      displayStatus === 'CANCELLED' ||
      displayStatus === 'DONE' ||
      displayStatus === 'MISSED'
    );
  }

  canDeleteAppointment(appointment: BabyAppointmentResponseDTO): boolean {
    const displayStatus = this.getDisplayStatus(appointment);
    return (
      displayStatus === 'PLANNED' ||
      displayStatus === 'CANCELLED' ||
      displayStatus === 'DONE' ||
      displayStatus === 'MISSED'
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // Stats
  // ──────────────────────────────────────────────────────────────────────

  get upcomingCount(): number {
    return this.appointments.filter(
      (a) => this.getDisplayStatus(a) === 'PLANNED'
    ).length;
  }

  get cancelledCount(): number {
    return this.appointments.filter((a) => this.getDisplayStatus(a) === 'CANCELLED').length;
  }

  get doneCount(): number {
    return this.appointments.filter((a) => this.getDisplayStatus(a) === 'DONE').length;
  }

  get plannedCount(): number {
    return this.appointments.filter((a) => this.getDisplayStatus(a) === 'PLANNED').length;
  }

  get missedCount(): number {
    return this.appointments.filter((a) => this.getDisplayStatus(a) === 'MISSED').length;
  }

  // ──────────────────────────────────────────────────────────────────────
  // Main Modal
  // ──────────────────────────────────────────────────────────────────────

  openAddModal(date?: Date): void {
    if (date && this.isPastDay(date)) {
      this.errorMessage = 'Past dates cannot be used to create a new appointment.';
      return;
    }

    this.isEditMode = false;
    this.selectedAppointmentId = null;
    this.errorMessage = '';
    this.successMessage = '';

    this.appointmentForm.reset({
      appointmentDate: date ? this.toDateOnlyString(date) : '',
      appointmentTime: '10:00',
      doctorName: '',
      type: '',
      location: '',
      reminderDate: '',
      notes: ''
    });

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.selectedAppointmentId = null;

    this.appointmentForm.reset({
      appointmentDate: '',
      appointmentTime: '10:00',
      doctorName: '',
      type: '',
      location: '',
      reminderDate: '',
      notes: ''
    });
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const date = this.appointmentForm.value.appointmentDate;
    const time = this.appointmentForm.value.appointmentTime || '10:00';

    const payload: BabyAppointmentRequestDTO = {
      appointmentDate: `${date}T${time}:00`,
      doctorName: this.trimOrEmpty(this.appointmentForm.value.doctorName),
      type: this.appointmentForm.value.type,
      location: this.undefinedIfBlank(this.appointmentForm.value.location),
      status: 'PLANNED',
      reminderDate: this.appointmentForm.value.reminderDate
        ? `${this.appointmentForm.value.reminderDate}T09:00:00`
        : undefined,
      notes: this.undefinedIfBlank(this.appointmentForm.value.notes)
    };

    const request$ =
      this.isEditMode && this.selectedAppointmentId !== null
        ? this.appointmentService.updateAppointment(this.babyId, this.selectedAppointmentId, payload)
        : this.appointmentService.createAppointment(this.babyId, payload);

    request$.subscribe({
      next: () => {
        this.successMessage = this.isEditMode
          ? 'Appointment updated successfully.'
          : 'Appointment added successfully.';
        this.closeModal();
        this.loadAppointments();
        this.submitting = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = this.extractErrorMessage(
          error,
          this.isEditMode ? 'Error updating appointment.' : 'Error adding appointment.'
        );
        this.submitting = false;
      }
    });
  }

  editAppointment(appointment: BabyAppointmentResponseDTO): void {
    this.isEditMode = true;
    this.selectedAppointmentId = appointment.id;
    this.errorMessage = '';
    this.successMessage = '';

    const dateStr = appointment.appointmentDate?.split('T')[0] || '';
    const timeStr = appointment.appointmentDate?.split('T')[1]?.substring(0, 5) || '10:00';

    this.appointmentForm.patchValue({
      appointmentDate: dateStr,
      appointmentTime: timeStr,
      doctorName: appointment.doctorName,
      type: appointment.type,
      location: appointment.location || '',
      reminderDate: appointment.reminderDate?.split('T')[0] || '',
      notes: appointment.notes || ''
    });

    this.showModal = true;
  }

  deleteAppointment(appointmentId: number): void {
    const appointment = this.appointments.find((a) => a.id === appointmentId);
    if (!appointment) return;

    if (!window.confirm('Delete this appointment?')) return;

    this.appointmentService.deleteAppointment(this.babyId, appointmentId).subscribe({
      next: () => {
        this.successMessage = 'Appointment deleted.';
        this.loadAppointments();
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = this.extractErrorMessage(error, 'Error deleting appointment.');
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // Status Modal
  // ──────────────────────────────────────────────────────────────────────

  openStatusModal(appointment: BabyAppointmentResponseDTO): void {
    if (!this.canChangeStatus(appointment)) {
      this.errorMessage = 'This appointment cannot change status.';
      return;
    }

    this.modalTargetAppointment = appointment;
    this.selectedStatusAction = null;
    this.statusNotes = appointment.notes || '';
    this.statusSubmitting = false;
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.modalTargetAppointment = null;
    this.selectedStatusAction = null;
    this.statusNotes = '';
    this.statusSubmitting = false;
  }

  chooseStatusAction(action: StatusAction): void {
    this.selectedStatusAction = action;
  }

  submitStatusAction(): void {
    if (!this.modalTargetAppointment || !this.selectedStatusAction) return;

    const target = this.modalTargetAppointment;

    this.statusSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: BabyAppointmentRequestDTO = {
      appointmentDate: target.appointmentDate,
      doctorName: target.doctorName,
      type: target.type,
      location: target.location || undefined,
      status: this.selectedStatusAction,
      reminderDate: target.reminderDate || undefined,
      notes: this.undefinedIfBlank(this.statusNotes) ?? this.undefinedIfBlank(target.notes)
    };

    this.appointmentService.updateAppointment(this.babyId, target.id, payload).subscribe({
      next: () => {
        this.successMessage = `Appointment marked as ${this.selectedStatusAction?.toLowerCase()}.`;
        this.closeStatusModal();
        this.loadAppointments();
        this.statusSubmitting = false;
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = this.extractErrorMessage(error, 'Error updating appointment status.');
        this.statusSubmitting = false;
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // UI Helpers
  // ──────────────────────────────────────────────────────────────────────

  getTypeColor(type: AppointmentType): string {
    const map: Record<string, string> = {
      PEDIATRE: 'type-pediatre',
      VACCIN: 'type-vaccin',
      CONTROLE: 'type-controle',
      URGENCE: 'type-urgence',
      AUTRE: 'type-autre'
    };
    return map[type] || 'type-autre';
  }

  getTypeEmoji(type: string): string {
    const map: Record<string, string> = {
      PEDIATRE: '👶',
      VACCIN: '💉',
      CONTROLE: '🩺',
      URGENCE: '🚨',
      AUTRE: '📋'
    };
    return map[type] || '📋';
  }

  trackByAppointmentId(_: number, a: BabyAppointmentResponseDTO): number {
    return a.id;
  }

  focusAppointmentInCalendar(appointment: BabyAppointmentResponseDTO): void {
    this.focusedAppointmentId = appointment.id;

    const apptDate = new Date(appointment.appointmentDate);
    this.initWeek(apptDate);

    setTimeout(() => {
      const chip = document.querySelector(`[data-appt-id="${appointment.id}"]`) as HTMLElement | null;
      chip?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }, 50);
  }

  // ──────────────────────────────────────────────────────────────────────
  // Utils
  // ──────────────────────────────────────────────────────────────────────

  private todayDateString(): string {
    const now = new Date();
    return this.toDateOnlyString(now);
  }

  private toDateOnlyString(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private trimOrEmpty(value: string): string {
    return (value || '').trim();
  }

  private undefinedIfBlank(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  private extractErrorMessage(error: any, fallback: string): string {
    return error?.error?.message || error?.error || fallback;
  }
}