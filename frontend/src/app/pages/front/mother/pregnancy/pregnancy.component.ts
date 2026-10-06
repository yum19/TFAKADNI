import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Pregnancy } from '../../../../core/models/pregnancy.model';
import { PregnancyService } from '../../../../core/services/pregnancy.service';
import { ExamBadgeService } from '../../../../core/services/exam-badge.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-femme-pregnancy',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatDividerModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule,
    MatNativeDateModule, MatSlideToggleModule,
    ReactiveFormsModule,
  ],
  templateUrl: './pregnancy.html',
  styleUrl: './pregnancy.scss',
  encapsulation: ViewEncapsulation.None,
})
export class PregnancyComponent implements OnInit {

  Math = Math;
  pregnancies: Pregnancy[] = [];
  pregnancy: Pregnancy | null = null;
  currentWeek = 0;
  pregnancyProgress = 0;
  trimester2Progress = 0;
  loading = true;
  saving = false;
  deleting = false;
  downloadingPdf = false;
  showDeleteConfirm = false;

  showForm = false;
  createForm: FormGroup;

  showEditForm = false;
  // ── Risk Score ────────────────────────────────────────
  showRiskPopup = false;
  riskLoading   = false;
  riskScore     = 0;
  riskLevel     = '';
  riskColor     = '';
  riskEmoji     = '';
  riskFactors: { label: string; impact: number; color: string }[] = [];
  riskAdvices: string[] = [];
  editForm: FormGroup;

  constructor(
    private pregnancyService: PregnancyService,
    private examBadge: ExamBadgeService,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.createForm = this.fb.group({
      lmpDate:         [null, [Validators.required, this.lmpDateValidator()]],
      dueDate:         [null, Validators.required],
      pregnancyType:   ['SINGLETON', Validators.required],
      hospitalName:    [''],
      doctorName:      [''],
      notes:           [''],
      isSharedPartner: [false],
    });

    this.editForm = this.fb.group({
      lmpDate:         [null, [Validators.required, this.lmpDateValidator()]],
      pregnancyType:   ['SINGLETON', Validators.required],
      hospitalName:    [''],
      doctorName:      [''],
      notes:           [''],
      isSharedPartner: [false],
    });
  }

  ngOnInit() {
    this.loadPregnancies();
    this.createForm.get('lmpDate')?.valueChanges.subscribe(lmpDate => {
      if (lmpDate) {
        const dueDate = new Date(lmpDate);
        dueDate.setDate(dueDate.getDate() + 280);
        this.createForm.patchValue({ dueDate }, { emitEvent: false });
      }
    });
  }

  lmpDateValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const lmp = new Date(control.value);
      const limit = new Date();
      limit.setDate(limit.getDate() - 280);
      return lmp < limit ? { lmpTooOld: true } : null;
    };
  }

  loadPregnancies() {
    this.loading = true;
    this.pregnancyService.getMyPregnancies().subscribe({
      next: (list) => {
        this.pregnancies = list;
        const active = list.find(p => p.status === 'ACTIVE');
        const latest = list.length > 0 ? list[list.length - 1] : null;
        this.pregnancy = active ?? latest;
        if (this.pregnancy) this.calculateWeek(this.pregnancy);
        this.loading = false;
      },
      error: (err) => {
        console.error("Failed to load data:", err);
        this.pregnancies = [];
        this.pregnancy = null;
        this.loading = false;
      }
    });
  }

  selectPregnancy(p: Pregnancy) {
    this.pregnancy = p;
    this.calculateWeek(p);
  }

  calculateWeek(p: Pregnancy) {
    const start = new Date(p.lmpDate);
    const today = new Date();
    const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
    this.currentWeek = Math.min(Math.max(diff, 0), 40);
    this.pregnancyProgress = Math.round((this.currentWeek / 40) * 100);
    this.trimester2Progress = this.currentWeek > 12
      ? Math.min(Math.round(((this.currentWeek - 12) / 14) * 100), 100) : 0;
  }

  canCreateNew(): boolean {
    return !this.pregnancies.some(p => p.status === 'ACTIVE');
  }

  // ===== CREATE =====
  openCreateForm() { this.showForm = true; }
  closeCreateForm() {
    this.showForm = false;
    this.createForm.reset({ pregnancyType: 'SINGLETON', isSharedPartner: false });
  }

  save() {
    if (this.createForm.invalid) return;
    this.saving = true;
    const val = this.createForm.value;
    const data = {
      ...val,
      lmpDate: this.formatDate(val.lmpDate),
      dueDate: this.formatDate(val.dueDate),
    };
    this.pregnancyService.createPregnancy(data).subscribe({
      next: () => {
        this.saving = false;
        this.closeCreateForm();
        this.loadPregnancies();
        this.examBadge.refresh();
      },
      error: () => { this.saving = false; }
    });
  }

  // ===== EDIT =====
  openEditForm() {
    if (!this.pregnancy) return;
    this.editForm.patchValue({
      lmpDate:         new Date(this.pregnancy.lmpDate),
      pregnancyType:   this.pregnancy.pregnancyType,
      hospitalName:    this.pregnancy.hospitalName || '',
      doctorName:      this.pregnancy.doctorName || '',
      notes:           this.pregnancy.notes || '',
      isSharedPartner: this.pregnancy.isSharedPartner || false,
    });
    this.showEditForm = true;
  }

  closeEditForm() {
    this.showEditForm = false;
    this.editForm.reset();
  }

  saveEdit() {
    if (this.editForm.invalid || !this.pregnancy) return;
    this.saving = true;
    const val = this.editForm.value;
    const lmp = new Date(val.lmpDate);
    const due = new Date(lmp);
    due.setDate(due.getDate() + 280);
    const data = {
      ...val,
      lmpDate: this.formatDate(lmp),
      dueDate: this.formatDate(due),
    };
    this.pregnancyService.updatePregnancy(this.pregnancy.id, data).subscribe({
      next: () => {
        this.saving = false;
        this.closeEditForm();
        this.loadPregnancies();
        this.examBadge.refresh();
      },
      error: () => { this.saving = false; }
    });
  }

  // ===== DELETE =====
deletePregnancy() {
  if (!this.pregnancy) return;
  this.showDeleteConfirm = true;
}

confirmDelete() {
  if (!this.pregnancy) return;
  this.showDeleteConfirm = false;
  this.deleting = true;
  this.pregnancyService.deletePregnancy(this.pregnancy.id).subscribe({
    next: () => { this.deleting = false; this.loadPregnancies(); this.examBadge.reset(); },
    error: () => { this.deleting = false; }
  });
}

  // ══════════════════════════════════════════════════════
  // RISK SCORE — coller après deletePregnancy()
  // ══════════════════════════════════════════════════════
  async openRiskPopup() {
    this.showRiskPopup = true;
    this.riskLoading   = true;
    this.riskScore     = 0;
    this.riskFactors   = [];
    this.riskAdvices   = [];

    try {
      const [vitals, alerts] = await Promise.all([
        new Promise<any[]>((res) =>
          this.http.get<any[]>(`${environment.apiUrl}/vitals/me`)
            .subscribe({ next: res, error: (err) => { console.error(err); res([]); } })
        ),
        new Promise<any[]>((res) =>
          this.http.get<any[]>(`${environment.apiUrl}/alerts/me`)
            .subscribe({ next: res, error: (err) => { console.error(err); res([]); } })
        ),
      ]);
      this.calculateRisk(vitals, alerts);
    } catch {
      this.calculateRisk([], []);
    }

    this.riskLoading = false;
  }

  closeRiskPopup() { this.showRiskPopup = false; }

  private calculateRisk(vitals: any[], alerts: any[]) {
    let score = 100;
    const factors: { label: string; impact: number; color: string }[] = [];
    const advices: string[] = [];
    const latest = vitals.length > 0 ? vitals[0] : null;

    if (latest) {
      const s = latest.systolicBp, d = latest.diastolicBp;
      if (s >= 160 || d >= 110) {
        score -= 25;
        factors.push({ label: `Blood pressure ${s}/${d} mmHg — Critical hypertension`, impact: -25, color: '#e53935' });
        advices.push('🚨 Contact your doctor immediately about your blood pressure.');
      } else if (s >= 140 || d >= 90) {
        score -= 15;
        factors.push({ label: `Blood pressure ${s}/${d} mmHg — Hypertension`, impact: -15, color: '#ff9800' });
        advices.push('⚠️ Rest and monitor your blood pressure closely.');
      } else if (s >= 130 || d >= 80) {
        score -= 8;
        factors.push({ label: `Blood pressure ${s}/${d} mmHg — Borderline`, impact: -8, color: '#ffc107' });
        advices.push('💡 Reduce salt intake and monitor regularly.');
      } else {
        factors.push({ label: `Blood pressure ${s}/${d} mmHg — Normal ✅`, impact: 0, color: '#4d8c52' });
      }

      if (latest.heartRate > 120) {
        score -= 15;
        factors.push({ label: `Heart rate ${latest.heartRate} bpm — Tachycardia`, impact: -15, color: '#e53935' });
        advices.push('🚨 Sit down and breathe slowly. Call your doctor if it persists.');
      } else if (latest.heartRate > 100) {
        score -= 8;
        factors.push({ label: `Heart rate ${latest.heartRate} bpm — Elevated`, impact: -8, color: '#ff9800' });
        advices.push('⚠️ Rest and avoid caffeine.');
      } else {
        factors.push({ label: `Heart rate ${latest.heartRate} bpm — Normal ✅`, impact: 0, color: '#4d8c52' });
      }

      if (latest.oxygenPct != null) {
        if (latest.oxygenPct < 92) {
          score -= 20;
          factors.push({ label: `O₂ saturation ${latest.oxygenPct}% — Critical`, impact: -20, color: '#e53935' });
          advices.push('🚨 Low oxygen — open windows and call emergency if you feel faint.');
        } else if (latest.oxygenPct < 95) {
          score -= 10;
          factors.push({ label: `O₂ saturation ${latest.oxygenPct}% — Low`, impact: -10, color: '#ff9800' });
          advices.push('⚠️ Sit upright and breathe deeply.');
        } else {
          factors.push({ label: `O₂ saturation ${latest.oxygenPct}% — Normal ✅`, impact: 0, color: '#4d8c52' });
        }
      }

      if (latest.temperatureC != null) {
        if (latest.temperatureC > 39) {
          score -= 15;
          factors.push({ label: `Temperature ${latest.temperatureC}°C — High fever`, impact: -15, color: '#e53935' });
          advices.push('🚨 High fever — take paracetamol and contact your doctor.');
        } else if (latest.temperatureC > 38) {
          score -= 8;
          factors.push({ label: `Temperature ${latest.temperatureC}°C — Fever`, impact: -8, color: '#ff9800' });
          advices.push('⚠️ Rest, drink water and monitor your temperature.');
        }
      }

      if (latest.glucoseMmol != null) {
        if (latest.glucoseMmol < 3.0) {
          score -= 15;
          factors.push({ label: `Glucose ${latest.glucoseMmol} mmol/L — Hypoglycemia`, impact: -15, color: '#e53935' });
          advices.push('🚨 Eat fast sugar immediately (juice, glucose tablet).');
        } else if (latest.glucoseMmol > 9.0) {
          score -= 10;
          factors.push({ label: `Glucose ${latest.glucoseMmol} mmol/L — Hyperglycemia`, impact: -10, color: '#ff9800' });
          advices.push('⚠️ Avoid sugar and consult about gestational diabetes screening.');
        }
      }
    } else {
      factors.push({ label: 'No vital measurements recorded yet', impact: 0, color: '#9b8fa8' });
      advices.push('💡 Add your first vital measurement to get a complete risk assessment.');
    }

    const criticals = alerts.filter(a => a.severity === 'CRITICAL').length;
    const dangers   = alerts.filter(a => a.severity === 'DANGER').length;
    const alertPenalty = Math.min(criticals * 10 + dangers * 5, 30);
    if (alertPenalty > 0) {
      score -= alertPenalty;
      if (criticals > 0)
        factors.push({ label: `${criticals} critical alert${criticals > 1 ? 's' : ''} active`, impact: -(criticals * 10), color: '#e53935' });
      if (dangers > 0)
        factors.push({ label: `${dangers} danger alert${dangers > 1 ? 's' : ''} active`, impact: -(dangers * 5), color: '#ff9800' });
      advices.push('📋 Review your alerts and follow the recommendations.');
    } else if (alerts.length > 0) {
      factors.push({ label: 'No critical or danger alerts ✅', impact: 0, color: '#4d8c52' });
    }

    if (this.currentWeek >= 27) {
      score -= 5;
      factors.push({ label: `3rd trimester (week ${this.currentWeek}) — naturally higher monitoring needed`, impact: -5, color: '#7c3aed' });
      advices.push('💜 3rd trimester — increase monitoring frequency.');
    }

    score = Math.max(0, Math.min(100, score));

    if (score >= 80) {
      this.riskLevel = 'Low Risk'; this.riskColor = '#4d8c52'; this.riskEmoji = '🟢';
      if (advices.length === 0) advices.push('✅ Everything looks great! Keep up your routine check-ups.');
    } else if (score >= 60) {
      this.riskLevel = 'Moderate Risk'; this.riskColor = '#ff9800'; this.riskEmoji = '🟡';
    } else if (score >= 40) {
      this.riskLevel = 'Elevated Risk'; this.riskColor = '#ff5722'; this.riskEmoji = '🟠';
    } else {
      this.riskLevel = 'High Risk'; this.riskColor = '#e53935'; this.riskEmoji = '🔴';
      advices.unshift('🚨 Please contact your healthcare provider as soon as possible.');
    }

    this.riskScore   = score;
    this.riskFactors = factors;
    this.riskAdvices = advices;
  }

  get riskGaugeDash(): string {
    const circ = 339.3;
    return `${(this.riskScore / 100) * circ} ${circ}`;
  }
  get riskGaugeColor(): string {
  if (this.riskScore >= 80) return '#4d8c52';
  if (this.riskScore >= 60) return '#ff9800';
  if (this.riskScore >= 40) return '#ff5722';
  return '#e53935';
}

  // ===== PDF REPORT =====
  // ===== PDF REPORT — MAGAZINE MEDICAL STYLE =====
 async downloadReport() {
    if (!this.pregnancy) return;
    this.downloadingPdf = true;

    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210, H = 297;
      const ML = 14, MR = W - 14, CW = W - 28;

      // ── Palette ─────────────────────────────────────
      const ROSE       = [201,  77, 106] as [number,number,number];
      const ROSE_L     = [245, 198, 208] as [number,number,number];
      const ROSE_XL    = [252, 236, 240] as [number,number,number];
      const PEACH      = [217, 123,  88] as [number,number,number];
      const PEACH_L    = [252, 227, 214] as [number,number,number];
      const GOLD       = [168, 114,  46] as [number,number,number];
      const GOLD_L     = [245, 224, 192] as [number,number,number];
      const SAGE       = [ 77, 140,  82] as [number,number,number];
      const SAGE_L     = [200, 230, 202] as [number,number,number];
      const SAGE_XL    = [235, 248, 236] as [number,number,number];
      const SKY        = [ 58, 143, 181] as [number,number,number];
      const SKY_L      = [189, 227, 245] as [number,number,number];
      const CREAM      = [250, 243, 237] as [number,number,number];
      const CREAM_D    = [242, 230, 219] as [number,number,number];
      const DARK       = [ 30,  18,  21] as [number,number,number];
      const MID        = [ 74,  48,  56] as [number,number,number];
      const SOFT       = [140, 110, 118] as [number,number,number];
      const WHITE      = [255, 255, 255] as [number,number,number];
      const BORDER     = [225, 210, 200] as [number,number,number];

      // ── Helpers ─────────────────────────────────────
      const F  = (c: [number,number,number]) => doc.setFillColor(c[0], c[1], c[2]);
      const S  = (c: [number,number,number], w = 0.3) => { doc.setDrawColor(c[0], c[1], c[2]); doc.setLineWidth(w); };
      const T  = (c: [number,number,number]) => doc.setTextColor(c[0], c[1], c[2]);
      const B  = () => doc.setFont('helvetica', 'bold');
      const N  = () => doc.setFont('helvetica', 'normal');
      const SZ = (n: number) => doc.setFontSize(n);
      const RR = (x: number, y: number, w: number, h: number, r: number, s: 'F'|'S'|'FD' = 'F') =>
        doc.roundedRect(x, y, w, h, r, r, s);

      // Horizontal rule
      const HR = (y: number, x1 = ML, x2 = MR, color = BORDER) => {
        S(color, 0.25); doc.line(x1, y, x2, y);
      };

      // Card with border
      const card = (x: number, y: number, w: number, h: number,
                    bg: [number,number,number] = WHITE,
                    border: [number,number,number] = BORDER) => {
        F(bg); RR(x, y, w, h, 3, 'F');
        S(border, 0.3); RR(x, y, w, h, 3, 'S');
      };

      // Card with colored top border
      const cardAccent = (x: number, y: number, w: number, h: number,
                          color: [number,number,number],
                          bg: [number,number,number] = WHITE) => {
        card(x, y, w, h, bg, color);
        F(color); doc.rect(x, y, w, 2.5, 'F');
      };

      // Section title
      const secTitle = (text: string, y: number,
                        color: [number,number,number] = ROSE): number => {
        SZ(10); B(); T(color);
        doc.text(text, ML, y);
        const tw = doc.getTextWidth(text);
        S(color, 0.4); doc.line(ML + tw + 3, y - 1, MR, y - 1);
        HR(y + 1.5, ML, MR, color);
        T(DARK);
        return y + 8;
      };

      // Info label + value
      const kv = (label: string, value: string, x: number, y: number, maxW = 80): number => {
        SZ(6); B(); T(SOFT); doc.text(label.toUpperCase(), x, y);
        SZ(9); N(); T(DARK);
        const lines = doc.splitTextToSize(value || '—', maxW);
        doc.text(lines.slice(0, 2), x, y + 5);
        return y + 5 + lines.length * 4.5;
      };

      // Progress bar clean
      const pbar = (x: number, y: number, w: number, pct: number,
                    track: [number,number,number],
                    fill:  [number,number,number]) => {
        F(track); RR(x, y, w, 4, 2);
        if (pct > 0) { F(fill); RR(x, y, w * Math.min(pct,100)/100, 4, 2); }
        SZ(6.5); B(); T(fill);
        doc.text(`${Math.round(pct)}%`, x + w + 2, y + 3.5);
      };

      // Stat card
const statCard = (x: number, y: number, w: number,
                  label: string, value: string, sub: string,
                  accent: [number,number,number],
                  bg: [number,number,number] = WHITE) => {
  card(x, y, w, 30, bg, BORDER);
  F(accent); doc.rect(x, y, 2, 30, 'F');
  SZ(6.5); B(); T(SOFT);
  doc.text(label.toUpperCase(), x + 6, y + 10);

  // ── Taille de police adaptative ──
  SZ(14); B(); T(DARK);
  const maxW = w - 10;
  let fontSize = 14;
  while (doc.getTextWidth(value) > maxW && fontSize > 7) {
    fontSize--;
    SZ(fontSize);
  }
  // Tronquer si toujours trop long
  let displayValue = value;
  while (doc.getTextWidth(displayValue + '…') > maxW && displayValue.length > 1) {
    displayValue = displayValue.slice(0, -1);
  }
  if (displayValue !== value) displayValue += '…';
  doc.text(displayValue, x + 6, y + 22);

  SZ(7); N(); T(SOFT);
  doc.text(sub, x + 6, y + 27);
};

      // Table header row
      const tblHeader = (y: number, cols: {x: number, label: string}[],
                         color: [number,number,number] = ROSE): number => {
        F(color); doc.rect(ML, y, CW, 8, 'F');
        SZ(6.5); B(); T(WHITE);
        cols.forEach(c => doc.text(c.label, c.x, y + 5.5));
        return y + 8;
      };

      // Table row
      const tblRow = (y: number, idx: number, h = 9): number => {
        F(idx % 2 === 0 ? WHITE : CREAM);
        doc.rect(ML, y, CW, h, 'F');
        S(BORDER, 0.2); doc.line(ML, y + h, MR, y + h);
        return y;
      };

      // Masthead
      const masthead = (section: string, pageNum = '') => {
        // Cream top band
        F(CREAM_D); doc.rect(0, 0, W, 16, 'F');
        S(BORDER, 0.4); doc.line(0, 16, W, 16);
        // Logo
        SZ(11); B(); T(ROSE); doc.text('MAMAAI', ML, 11);
        // Section
        SZ(8); N(); T(MID); doc.text(section, ML + 28, 11);
        // Date
        SZ(7); N(); T(SOFT);
        doc.text(new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}), MR, 11, { align:'right' });
        // Rose line
        F(ROSE); doc.rect(0, 16, W, 1.5, 'F');
      };

      // Footer
      const pgFooter = (page: number, total: number) => {
        F(CREAM_D); doc.rect(0, H - 12, W, 12, 'F');
        S(BORDER, 0.4); doc.line(0, H - 12, W, H - 12);
        SZ(7); N(); T(SOFT);
        doc.text('MAMAAI  ·  Pregnancy Health Report  ·  Confidential Document', ML, H - 5);
        B(); T(ROSE); doc.text(`${page} / ${total}`, MR, H - 5, { align:'right' });
      };

      const p = this.pregnancy;
      const fmt = (d: string | Date) => new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});

      // ══════════════════════════════════════════════════
      // PAGE 1 — OVERVIEW
      // ══════════════════════════════════════════════════
      F(CREAM); doc.rect(0, 0, W, H, 'F');

      // ── Cover header ──
      F(ROSE); doc.rect(0, 0, W, 52, 'F');
      // Decorative circles
      F([220, 100, 130] as [number,number,number]); doc.circle(W - 20, 10, 22, 'F');
      F([210, 85, 118] as [number,number,number]);  doc.circle(W - 10, 28, 18, 'F');

      // Week bubble
      F(WHITE); doc.circle(MR - 18, 26, 20, 'F');
      F(ROSE_L); doc.circle(MR - 18, 26, 15, 'F');
      SZ(14); B(); T(ROSE); doc.text(`W${this.currentWeek}`, MR - 18, 24, { align:'center' });
      SZ(6.5); N(); T(MID); doc.text('of 40', MR - 18, 30, { align:'center' });

      // Title
      SZ(7); B(); T(ROSE_L); doc.text('PREGNANCY HEALTH REPORT', ML, 14);
      SZ(24); B(); T(WHITE); doc.text('My Pregnancy', ML, 30);
      SZ(9); N(); T(ROSE_L); doc.text('A personalized overview of your journey', ML, 40);
      SZ(7.5); T(ROSE_XL);
      doc.text(`Week ${this.currentWeek} of 40  ·  ${this.getTrimester()}  ·  ${this.pregnancyProgress}% complete`, ML, 48);

      // ── Progress band ──
      F(CREAM_D); doc.rect(0, 52, W, 12, 'F');
      S(BORDER, 0.3); doc.line(0, 64, W, 64);
      const bW = (CW - 8) / 3;
      const t1p = this.currentWeek >= 12 ? 100 : Math.round((this.currentWeek/12)*100);
      const t2p = this.currentWeek > 26 ? 100 : this.currentWeek > 12 ? Math.round(((this.currentWeek-12)/14)*100) : 0;
      const t3p = this.currentWeek > 26 ? Math.round(((this.currentWeek-26)/14)*100) : 0;
      [
        { label:'Trimester 1 · W1–12',  pct:t1p, fill:PEACH,  track:PEACH_L  },
        { label:'Trimester 2 · W13–26', pct:t2p, fill:ROSE,   track:ROSE_L   },
        { label:'Trimester 3 · W27–40', pct:t3p, fill:GOLD,   track:GOLD_L   },
      ].forEach((t, i) => {
        const bx = ML + i * (bW + 4);
        SZ(6.5); B(); T(MID); doc.text(t.label, bx, 58);
        pbar(bx, 59.5, bW - 12, t.pct, t.track, t.fill);
      });

      // ── 4 stat cards ──
      let y = 72;
      const sc = (CW - 9) / 4;
      statCard(ML,         y, sc, 'Current Week',  `W${this.currentWeek}`,            '/40',              ROSE,  ROSE_XL);
      statCard(ML+sc+3,    y, sc, 'Trimester',     this.getTrimester().replace(/\w+ /,''), this.getTrimester().split(' ')[0], PEACH, PEACH_L);
      statCard(ML+(sc+3)*2,y, sc, 'Type',          this.getTypeLabel(p.pregnancyType), '',                 GOLD,  GOLD_L);
      statCard(ML+(sc+3)*3,y, sc, 'Status',        this.getStatusLabel(p.status),      '',                 SAGE,  SAGE_XL);
      y += 38;

      HR(y, ML, MR, BORDER); y += 6;

      // ── Dates section ──
      y = secTitle('Important Dates', y, ROSE);
      const dW = (CW - 6) / 3;
      [
        { label:'Last Menstrual Period', value:fmt(p.lmpDate), color:PEACH, bg:PEACH_L  },
        { label:'Expected Due Date',     value:fmt(p.dueDate), color:ROSE,  bg:ROSE_XL  },
        { label:'Record Created',        value:p.createdAt ? fmt(p.createdAt) : '—', color:SKY, bg:SKY_L },
      ].forEach((d, i) => {
        const dx = ML + i*(dW+3);
        cardAccent(dx, y, dW, 24, d.color, d.bg);
        SZ(6); B(); T(d.color); doc.text(d.label.toUpperCase(), dx+5, y+12);
        SZ(8.5); N(); T(DARK); doc.text(d.value, dx+5, y+19);
      });
      y += 32;

      HR(y, ML, MR, BORDER); y += 6;

      // ── Medical & Notes ──
      y = secTitle('Medical Follow-up', y, GOLD);
      const mW = (CW - 4) / 2;

      // Medical card
      cardAccent(ML, y, mW, 32, GOLD, GOLD_L);
      kv('Attending Physician', p.doctorName || '—', ML+5, y+8, mW-10);
      kv('Hospital / Clinic', p.hospitalName || '—', ML + mW/2, y+8, mW/2-5);

      // Notes card
      cardAccent(ML+mW+4, y, mW, 32, PEACH, PEACH_L);
      SZ(6); B(); T(SOFT); doc.text('NOTES', ML+mW+9, y+9);
      SZ(8.5); N(); T(DARK);
      const nl = doc.splitTextToSize(p.notes || 'No notes recorded.', mW-10);
      doc.text(nl.slice(0,2), ML+mW+9, y+16);
      y += 40;

      HR(y, ML, MR, BORDER); y += 6;

      // ── Sharing info ──
      if (p.isSharedPartner) {
        F(SAGE_L); RR(ML, y, CW, 12, 3);
        F(SAGE); doc.rect(ML, y, 3, 12, 'F');
        SZ(8); B(); T(SAGE); doc.text('Shared with partner', ML+7, y+5.5);
        SZ(7); N(); T(MID); doc.text('Your partner can view your pregnancy folder, exams and fetal development.', ML+7, y+10);
      }

      // ══════════════════════════════════════════════════
      // PAGE 2 — VITAL SIGNS
      // ══════════════════════════════════════════════════
      doc.addPage();
      F(CREAM); doc.rect(0, 0, W, H, 'F');
      masthead('Vital Signs History');

      let vitals: any[] = [];
      try {
        vitals = await new Promise((res, rej) =>
          this.http.get<any[]>(`${environment.apiUrl}/vitals/me`).subscribe({next:res, error:rej})
        );
      } catch { vitals = []; }

      const vSlice = vitals.slice(0, 15);
      let yV = 24;

      // Latest 4 stat cards
      if (vSlice.length > 0) {
        const lv = vSlice[0];
        yV = secTitle('Latest Measurements', yV, ROSE);
        const lvW = (CW - 9) / 4;
        const bpH = lv.systolicBp >= 140 || lv.diastolicBp >= 90;
        const bpW = lv.systolicBp >= 130 || lv.diastolicBp >= 80;
        const bpColor = bpH ? ROSE : bpW ? PEACH : SAGE;
        [
          { l:'Blood Pressure', v:`${lv.systolicBp}/${lv.diastolicBp}`, u:'mmHg', c:bpColor, bg:bpH ? ROSE_XL : bpW ? PEACH_L : SAGE_XL },
          { l:'Weight',         v:`${lv.weightKg}`,                      u:'kg',   c:GOLD,    bg:GOLD_L   },
          { l:'Heart Rate',     v:`${lv.heartRate}`,                     u:'bpm',  c:SAGE,    bg:SAGE_XL  },
          { l:'O2 Saturation',  v:`${lv.oxygenPct ?? '—'}`,              u:'%',    c:SKY,     bg:SKY_L    },
        ].forEach((s, i) => {
          statCard(ML + i*(lvW+3), yV, lvW, s.l, s.v, s.u, s.c as [number,number,number], s.bg as [number,number,number]);
        });
        yV += 38;
      }

      // History table
      yV = secTitle('Measurements History', yV, ROSE);

      if (vSlice.length === 0) {
        card(ML, yV, CW, 16, CREAM, BORDER);
        SZ(9); N(); T(SOFT); doc.text('No vital measurements recorded yet.', W/2, yV+10, {align:'center'});
        yV += 20;
      } else {
        // Outer border
        S(BORDER, 0.4); doc.rect(ML, yV, CW, 8 + vSlice.length * 8.5, 'F');
        F(WHITE); doc.rect(ML, yV, CW, 8 + vSlice.length * 8.5, 'F');
        S(BORDER, 0.4); RR(ML, yV, CW, 8 + vSlice.length * 8.5, 2, 'S');

        const hCols = [
          {x:ML+3,  label:'DATE'},
          {x:ML+32, label:'BLOOD PRESSURE'},
          {x:ML+68, label:'WEIGHT (kg)'},
          {x:ML+94, label:'HEART RATE'},
          {x:ML+119,label:'O2 (%)'},
          {x:ML+140,label:'TEMP (°C)'},
          {x:ML+162,label:'GLUCOSE'},
        ];
        yV = tblHeader(yV, hCols, ROSE);

        vSlice.forEach((v, idx) => {
          tblRow(yV, idx, 8.5);

          // BP status dot
          const bpH = v.systolicBp >= 140 || v.diastolicBp >= 90;
          const bpW2 = v.systolicBp >= 130 || v.diastolicBp >= 80;
          const dc = bpH ? ROSE : bpW2 ? PEACH : SAGE;
          F(dc); doc.circle(ML + 2, yV + 4.2, 1.2, 'F');

          const d = new Date(v.measuredAt);
          SZ(8); N(); T(DARK);
          doc.text(`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`, ML+5, yV+6);
          B(); T(dc); doc.text(`${v.systolicBp}/${v.diastolicBp}`, ML+32, yV+6);
          N(); T(DARK);
          doc.text(`${v.weightKg}`,            ML+68,  yV+6);
          doc.text(`${v.heartRate}`,           ML+94,  yV+6);
          doc.text(`${v.oxygenPct ?? '—'}`,    ML+119, yV+6);
          doc.text(`${v.temperatureC ?? '—'}`, ML+140, yV+6);
          doc.text(`${v.glucoseMmol ?? '—'}`,  ML+162, yV+6);
          yV += 8.5;
        });

        // Legend
        yV += 5;
        SZ(6.5); N();
        F(SAGE);  doc.circle(ML+2,    yV-1, 1.3, 'F'); T(SOFT); doc.text('Normal  (<130/80)',          ML+5,  yV);
        F(PEACH); doc.circle(ML+55,   yV-1, 1.3, 'F'); T(SOFT); doc.text('Borderline  (130-139/80-89)', ML+58, yV);
        F(ROSE);  doc.circle(ML+120,  yV-1, 1.3, 'F'); T(SOFT); doc.text('Hypertension  (>=140/90)',    ML+123,yV);
        yV += 8;
      }

      // ══════════════════════════════════════════════════
      // PAGE 3 — PRENATAL EXAMS
      // ══════════════════════════════════════════════════
      doc.addPage();
      F(CREAM); doc.rect(0, 0, W, H, 'F');
      masthead('Prenatal Examinations');

      let exams: any[] = [];
      try {
        exams = await new Promise((res, rej) =>
          this.http.get<any[]>(`${environment.apiUrl}/exams/pregnancy/${p.id}`).subscribe({next:res, error:rej})
        );
      } catch { exams = []; }

      const done    = exams.filter(e => e.done);
      const pending = exams.filter(e => !e.done);
      const pctEx   = exams.length > 0 ? Math.round(done.length/exams.length*100) : 0;
      let yE = 24;

      // 4 stat cards
      const esW = (CW - 9) / 4;
      statCard(ML,          yE, esW, 'Total Exams',  `${exams.length}`,  'exams',    ROSE,  ROSE_XL );
      statCard(ML+esW+3,    yE, esW, 'Completed',    `${done.length}`,   'done',     SAGE,  SAGE_XL );
      statCard(ML+(esW+3)*2,yE, esW, 'Pending',      `${pending.length}`, 'remaining',GOLD, GOLD_L  );
      statCard(ML+(esW+3)*3,yE, esW, 'Progress',     `${pctEx}%`,        'complete', SKY,   SKY_L   );
      yE += 38;

      // Progress bar global
      SZ(7); B(); T(SOFT); doc.text('OVERALL COMPLETION', ML, yE);
      pbar(ML + 45, yE - 3.5, CW - 60, pctEx, SAGE_L, SAGE);
      yE += 8;

      HR(yE, ML, MR, BORDER); yE += 6;

      // ── Completed ──
      yE = secTitle(`Completed Exams  (${done.length})`, yE, SAGE);

      if (done.length === 0) {
        card(ML, yE, CW, 14, SAGE_XL, SAGE_L);
        SZ(8.5); N(); T(SOFT); doc.text('No completed exams yet.', W/2, yE+9, {align:'center'});
        yE += 18;
      } else {
        // Table with border
        const doneH = 8 + done.length * 8.5;
        F(WHITE); RR(ML, yE, CW, doneH, 2);
        S(SAGE_L, 0.4); RR(ML, yE, CW, doneH, 2, 'S');

        yE = tblHeader(yE, [
          {x:ML+3,  label:'EXAM NAME'},
          {x:ML+108,label:'WEEK'},
          {x:ML+127,label:'TYPE'},
          {x:ML+155,label:'DATE DONE'},
        ], SAGE);

        done.forEach((e, idx) => {
          tblRow(yE, idx);
          // Green dot
          F(SAGE); doc.circle(ML+2, yE+4.2, 1.2, 'F');
          SZ(8.5); B(); T(DARK); doc.text(e.examName || '—', ML+6, yE+6);
          SZ(7.5); N(); T(SOFT);
          doc.text(e.recommendedWeek ? `W${e.recommendedWeek}` : '—', ML+108, yE+6);
          doc.text(e.examType || '—', ML+127, yE+6);
          if (e.doneDate) {
            const dd = new Date(e.doneDate);
            doc.text(`${dd.getDate()}/${dd.getMonth()+1}/${dd.getFullYear()}`, ML+155, yE+6);
          }
          yE += 8.5;
          if (yE > 265) {
            doc.addPage(); F(CREAM); doc.rect(0,0,W,H,'F');
            masthead('Prenatal Examinations (cont.)'); yE = 24;
          }
        });
        yE += 6;
      }

      HR(yE, ML, MR, BORDER); yE += 6;

      // ── Pending ──
      yE = secTitle(`Pending Exams  (${pending.length})`, yE, GOLD);

      if (pending.length === 0) {
        card(ML, yE, CW, 14, GOLD_L, GOLD);
        SZ(8.5); B(); T(GOLD); doc.text('All exams completed — excellent!', W/2, yE+9, {align:'center'});
        yE += 18;
      } else {
        const pendH = 8 + pending.length * 8.5;
        F(WHITE); RR(ML, yE, CW, pendH, 2);
        S(GOLD_L, 0.4); RR(ML, yE, CW, pendH, 2, 'S');

        yE = tblHeader(yE, [
          {x:ML+3,  label:'EXAM NAME'},
          {x:ML+103,label:'RECOMMENDED'},
          {x:ML+140,label:'TYPE'},
          {x:ML+165,label:'PRIORITY'},
        ], GOLD);

        pending.forEach((e, idx) => {
          tblRow(yE, idx);
          const sev = e.alertSeverity || '';
          const sevColor: [number,number,number] =
            sev === 'CRITICAL' || sev === 'DANGER' ? ROSE :
            sev === 'HIGH'     ? PEACH : GOLD;

          // Severity bar left
          F(sevColor); doc.rect(ML, yE, 2.5, 8.5, 'F');

          SZ(8.5); B(); T(DARK); doc.text(e.examName || '—', ML+5, yE+6);
          SZ(7.5); N(); T(SOFT);
          doc.text(e.recommendedWeek ? `Week ${e.recommendedWeek}` : 'As needed', ML+103, yE+6);
          doc.text(e.examType || '—', ML+140, yE+6);

          if (sev) {
            // Badge
            const bw = doc.getTextWidth(sev) + 6;
            F(sev === 'CRITICAL' || sev === 'DANGER' ? ROSE_XL : GOLD_L);
            RR(ML+163, yE+1.5, bw, 5.5, 1);
            SZ(6.5); B(); T(sevColor); doc.text(sev, ML+166, yE+5.5);
          }

          yE += 8.5;
          if (yE > 265) {
            doc.addPage(); F(CREAM); doc.rect(0,0,W,H,'F');
            masthead('Prenatal Examinations (cont.)'); yE = 24;
          }
        });
      }

      // ── Footers ──────────────────────────────────────
      const total = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        pgFooter(i, total);
      }

      doc.save(`MAMAAI_Report_W${this.currentWeek}_${new Date().toISOString().split('T')[0]}.pdf`);

    } finally {
      this.downloadingPdf = false;
    }
  }
  // ===== HELPERS =====
  formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  }

  getTrimester(): string {
    if (this.currentWeek <= 12) return '1st Trimester';
    if (this.currentWeek <= 26) return '2nd Trimester';
    return '3rd Trimester';
  }

  getStatusLabel(s: string): string {
    const m: any = { ACTIVE: 'Active', COMPLETED: 'Completed', MISCARRIAGE: 'Miscarriage', TERMINATED: 'Terminated' };
    return m[s] || s;
  }

  getStatusColor(s: string): string {
    const m: any = { ACTIVE: '#4caf50', COMPLETED: '#03a9f4', MISCARRIAGE: '#f44336', TERMINATED: '#ff9800' };
    return m[s] || '#999';
  }

  getTypeLabel(t: string): string {
    const m: any = { SINGLETON: 'Single pregnancy', TWINS: 'Twins', TRIPLETS: 'Triplets' };
    return m[t] || t;
  }
}