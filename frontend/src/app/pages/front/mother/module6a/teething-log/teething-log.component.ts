import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  TeethingLogRequestDTO,
  TeethingLogResponseDTO,
  TeethingLogService
} from '../../../../../core/services/module6a/teething-log.service';

export interface ToothDef {
  id: number;
  label: string;
  jaw: 'upper' | 'lower';
  minMonth: number;
  maxMonth: number;
}

export const TOOTH_DEFS: ToothDef[] = [
  { id: 1,  label: 'Upper Second Molar (L)',    jaw: 'upper', minMonth: 25, maxMonth: 33 },
  { id: 2,  label: 'Upper First Molar (L)',     jaw: 'upper', minMonth: 13, maxMonth: 19 },
  { id: 3,  label: 'Upper Canine (L)',          jaw: 'upper', minMonth: 16, maxMonth: 22 },
  { id: 4,  label: 'Upper Lateral Incisor (L)', jaw: 'upper', minMonth: 9,  maxMonth: 13 },
  { id: 5,  label: 'Upper Central Incisor (L)', jaw: 'upper', minMonth: 8,  maxMonth: 12 },
  { id: 6,  label: 'Upper Central Incisor (R)', jaw: 'upper', minMonth: 8,  maxMonth: 12 },
  { id: 7,  label: 'Upper Lateral Incisor (R)', jaw: 'upper', minMonth: 9,  maxMonth: 13 },
  { id: 8,  label: 'Upper Canine (R)',          jaw: 'upper', minMonth: 16, maxMonth: 22 },
  { id: 9,  label: 'Upper First Molar (R)',     jaw: 'upper', minMonth: 13, maxMonth: 19 },
  { id: 10, label: 'Upper Second Molar (R)',    jaw: 'upper', minMonth: 25, maxMonth: 33 },

  { id: 11, label: 'Lower Second Molar (L)',    jaw: 'lower', minMonth: 23, maxMonth: 31 },
  { id: 12, label: 'Lower First Molar (L)',     jaw: 'lower', minMonth: 14, maxMonth: 18 },
  { id: 13, label: 'Lower Canine (L)',          jaw: 'lower', minMonth: 17, maxMonth: 23 },
  { id: 14, label: 'Lower Lateral Incisor (L)', jaw: 'lower', minMonth: 10, maxMonth: 16 },
  { id: 15, label: 'Lower Central Incisor (L)', jaw: 'lower', minMonth: 6,  maxMonth: 10 },
  { id: 16, label: 'Lower Central Incisor (R)', jaw: 'lower', minMonth: 6,  maxMonth: 10 },
  { id: 17, label: 'Lower Lateral Incisor (R)', jaw: 'lower', minMonth: 10, maxMonth: 16 },
  { id: 18, label: 'Lower Canine (R)',          jaw: 'lower', minMonth: 17, maxMonth: 23 },
  { id: 19, label: 'Lower First Molar (R)',     jaw: 'lower', minMonth: 14, maxMonth: 18 },
  { id: 20, label: 'Lower Second Molar (R)',    jaw: 'lower', minMonth: 23, maxMonth: 31 },
];

export interface ArcTooth {
  def: ToothDef;
  cx: number;
  cy: number;
  status: 'erupted' | 'early' | 'pending';
  displayLabel: string;
  displayLine2?: string;
  log?: TeethingLogResponseDTO;
}

@Component({
  selector: 'app-teething-log',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './teething-log.component.html',
  styleUrls: ['./teething-log.component.css']
})
export class TeethingLogComponent implements OnInit {
  babyId!: number;

  @ViewChild('formCard') private readonly formCard?: ElementRef<HTMLElement>;

  teethingLogs: TeethingLogResponseDTO[] = [];
  loading = false;
  submitting = false;
  isEditMode = false;
  selectedLogId: number | null = null;
  errorMessage = '';
  successMessage = '';

  upperTeeth: ArcTooth[] = [];
  lowerTeeth: ArcTooth[] = [];

  activeArcTab: 'tracking' | 'chart' = 'tracking';

  showAddModal = false;
  modalToothLabel = '';
  modalEruptionDate = '';
  modalSymptoms = '';
  modalNotes = '';
  modalError = '';

  teethingForm!: FormGroup;

  /**
   * Date de naissance de test pour TON cas
   * Bébé né le 17/10/2025
   */
  babyBirthDate = new Date('2025-10-17');

  constructor(
    private fb: FormBuilder,
    private teethingLogService: TeethingLogService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    const param = this.route.snapshot.paramMap.get('babyId');
    this.babyId = param ? +param : 1;
    this.loadLogs();
  }

  initForm(): void {
    this.teethingForm = this.fb.group({
      toothLabel: ['', Validators.required],
      eruptionDate: ['', Validators.required],
      symptoms: [''],
      notes: ['']
    });
  }

  loadLogs(): void {
    this.loading = true;
    this.errorMessage = '';

    this.teethingLogService.getAllTeethingLogsByBaby(this.babyId).subscribe({
      next: (data) => {
        this.teethingLogs = data ?? [];
        this.loading = false;
        this.buildArc();
      },
      error: () => {
        this.errorMessage = 'Error loading teething logs.';
        this.loading = false;
      }
    });
  }

  buildArc(): void {
    this.upperTeeth = this.buildJaw('upper');
    this.lowerTeeth = this.buildJaw('lower');
  }

  buildJaw(jaw: 'upper' | 'lower'): ArcTooth[] {
    const defs = TOOTH_DEFS.filter(d => d.jaw === jaw);
    const total = defs.length;

    const centerX = 150;
    const centerY = 85;
    const radiusX = 125;
    const radiusY = 64;

    const startAngle = jaw === 'upper' ? Math.PI : 0;
    const endAngle = jaw === 'upper' ? 2 * Math.PI : Math.PI;

    const angles = this.computeArcLengthAngles(total, startAngle, endAngle, radiusX, radiusY);

    return defs.map((def, index) => {
      const angle = angles[index] ?? (startAngle + (endAngle - startAngle) / 2);

      const x = centerX + radiusX * Math.cos(angle);
      const y = centerY + radiusY * Math.sin(angle);

      const log = this.teethingLogs.find(l => l.toothLabel === def.label);
      const status = this.getToothStatus(def, log);

      let displayLabel = `${def.minMonth}`;
      let displayLine2 = `${def.maxMonth}`;

      if (log) {
        displayLabel = String(def.id);
        displayLine2 = '';
      }

      return {
        def,
        cx: x,
        cy: y,
        status,
        displayLabel,
        displayLine2,
        log
      };
    });
  }

  getToothStatus(def: ToothDef, log?: TeethingLogResponseDTO): 'erupted' | 'early' | 'pending' {
    if (!log?.eruptionDate) {
      return 'pending';
    }

    const eruptionDate = new Date(log.eruptionDate);
    const ageAtEruptionMonths = this.getAgeInMonths(this.babyBirthDate, eruptionDate);

    if (ageAtEruptionMonths < def.minMonth) {
      return 'early';
    }

    return 'erupted';
  }

  getAgeInMonths(birthDate: Date, targetDate: Date): number {
    let months =
      (targetDate.getFullYear() - birthDate.getFullYear()) * 12 +
      (targetDate.getMonth() - birthDate.getMonth());

    if (targetDate.getDate() < birthDate.getDate()) {
      months -= 1;
    }

    return months;
  }

  private computeArcLengthAngles(
    count: number,
    startAngle: number,
    endAngle: number,
    radiusX: number,
    radiusY: number
  ): number[] {
    if (count <= 0) return [];
    if (count === 1) return [startAngle + (endAngle - startAngle) / 2];

    const samples = 900;
    const angles: number[] = [];
    const cumulative: number[] = [];

    for (let i = 0; i <= samples; i++) {
      angles.push(startAngle + (i / samples) * (endAngle - startAngle));
    }

    cumulative.push(0);
    let totalLength = 0;

    for (let i = 1; i < angles.length; i++) {
      const a0 = angles[i - 1];
      const a1 = angles[i];

      const x0 = radiusX * Math.cos(a0);
      const y0 = radiusY * Math.sin(a0);
      const x1 = radiusX * Math.cos(a1);
      const y1 = radiusY * Math.sin(a1);

      totalLength += Math.hypot(x1 - x0, y1 - y0);
      cumulative.push(totalLength);
    }

    const result: number[] = [];

    for (let i = 0; i < count; i++) {
      const target = (i / (count - 1)) * totalLength;

      let idx = cumulative.findIndex(v => v >= target);
      if (idx === -1) {
        result.push(angles[angles.length - 1]);
        continue;
      }
      if (idx === 0) {
        result.push(angles[0]);
        continue;
      }

      const prevLen = cumulative[idx - 1];
      const nextLen = cumulative[idx];
      const span = nextLen - prevLen;
      const t = span > 0 ? (target - prevLen) / span : 0;

      const prevAngle = angles[idx - 1];
      const nextAngle = angles[idx];
      result.push(prevAngle + t * (nextAngle - prevAngle));
    }

    return result;
  }

  getToothFill(status: 'erupted' | 'early' | 'pending'): string {
    if (status === 'erupted') return '#ff4f75';
    if (status === 'early') return '#e8a840';
    return '#ffaac2';
  }

  getTextFill(status: 'erupted' | 'early' | 'pending'): string {
    return status === 'pending' ? '#653f58' : '#ffffff';
  }

  trackByToothId(_: number, tooth: ArcTooth): number {
    return tooth.def.id;
  }

  openAddModal(selectedLabel?: string): void {
    this.modalToothLabel = selectedLabel || TOOTH_DEFS[0].label;
    this.modalEruptionDate = '';
    this.modalSymptoms = '';
    this.modalNotes = '';
    this.modalError = '';
    this.showAddModal = true;
  }

  openToothModal(tooth: ArcTooth): void {
    this.modalToothLabel = tooth.def.label;
    this.modalEruptionDate = '';
    this.modalSymptoms = '';
    this.modalNotes = '';
    this.modalError = '';
    this.showAddModal = true;
  }

  closeModal(): void {
    this.showAddModal = false;
  }

  submitModal(): void {
    if (!this.modalToothLabel || !this.modalEruptionDate) {
      this.modalError = 'Tooth label and eruption date are required.';
      return;
    }

    this.submitting = true;
    this.modalError = '';

    const payload: TeethingLogRequestDTO = {
      toothLabel: this.modalToothLabel,
      eruptionDate: this.modalEruptionDate,
      symptoms: this.modalSymptoms || undefined,
      notes: this.modalNotes || undefined
    };

    this.teethingLogService.createTeethingLog(this.babyId, payload).subscribe({
      next: () => {
        this.successMessage = 'Tooth added successfully!';
        this.showAddModal = false;
        this.submitting = false;
        this.loadLogs();
      },
      error: () => {
        this.modalError = 'Error saving. Please try again.';
        this.submitting = false;
      }
    });
  }

  onSubmit(): void {
    if (this.teethingForm.invalid) {
      this.teethingForm.markAllAsTouched();
      return;
    }

    if (!this.isEditMode || this.selectedLogId === null) return;

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: TeethingLogRequestDTO = {
      toothLabel: this.teethingForm.value.toothLabel.trim(),
      eruptionDate: this.teethingForm.value.eruptionDate,
      symptoms: this.teethingForm.value.symptoms?.trim() || undefined,
      notes: this.teethingForm.value.notes?.trim() || undefined
    };

    this.teethingLogService.updateTeethingLog(this.babyId, this.selectedLogId, payload).subscribe({
      next: () => {
        this.successMessage = 'Teething log updated successfully.';
        this.resetForm();
        this.loadLogs();
        this.submitting = false;
      },
      error: () => {
        this.errorMessage = 'Error updating teething log.';
        this.submitting = false;
      }
    });
  }

  editLog(log: TeethingLogResponseDTO): void {
    this.isEditMode = true;
    this.selectedLogId = log.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.teethingForm.patchValue({
      toothLabel: log.toothLabel,
      eruptionDate: log.eruptionDate,
      symptoms: log.symptoms || '',
      notes: log.notes || ''
    });

    this.formCard?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  deleteLog(logId: number): void {
    const confirmed = window.confirm('Are you sure you want to delete this teething log?');
    if (!confirmed) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.teethingLogService.deleteTeethingLog(this.babyId, logId).subscribe({
      next: () => {
        this.successMessage = 'Teething log deleted successfully.';
        this.loadLogs();
      },
      error: () => {
        this.errorMessage = 'Error deleting teething log.';
      }
    });
  }

  resetForm(): void {
    this.isEditMode = false;
    this.selectedLogId = null;
    this.teethingForm.reset();
  }

  trackByLogId(_: number, log: TeethingLogResponseDTO): number {
    return log.id;
  }
}