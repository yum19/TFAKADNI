import { 
  Component, 
  OnInit, 
  AfterViewInit, 
  ViewChild, 
  ElementRef, 
  ViewEncapsulation, 
  OnDestroy, 
  NgZone 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { Vitals } from '../../../../core/models/pregnancy.model';
import { VitalsService } from '../../../../core/services/vitals.service';
import { PregnancyService } from '../../../../core/services/pregnancy.service';
import { AlertBadgeService } from '../../../../core/services/alert-badge.service';
import { ExamBadgeService } from '../../../../core/services/exam-badge.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

Chart.register(...registerables);

@Component({
  selector: 'app-femme-vitals',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatFormFieldModule, MatInputModule,
    MatDividerModule, MatSelectModule, ReactiveFormsModule,
  ],
  templateUrl: './vitals.html',
  styleUrl: './vitals.scss',
  encapsulation: ViewEncapsulation.None,
})
export class VitalsComponent implements OnInit, AfterViewInit, OnDestroy {

  latestVital: Vitals | null = null;
  dataSource = new MatTableDataSource<Vitals>([]);
  displayedColumns: string[] = ['measuredAt', 'systolicBp', 'weightKg', 'heartRate', 'glucoseMmol', 'temperatureC', 'oxygenPct', 'actions'];
  loading = true;
  pregnancyId: number = 0;
  currentPregnancyWeek: number = 0;
  hasActivePregnancy = false;
  showDeleteVitalConfirm = false;
  vitalToDelete: Vitals | null = null;

  // ── ML Prediction ─────────────────────────────────────
  mlResult: any = null;
  mlLoading = false;
  showForm = false;
  showNoPregnancyAlert = false;
  saving = false;
  vitalForm: FormGroup;

  showEditForm = false;
  selectedVital: Vitals | null = null;
  editForm: FormGroup;

  // ── AI Analysis ──────────────────────────────────────
  showAiPopup      = false;
  aiLoading        = false;
  aiFollowLoading  = false;
  aiAnalysis       = '';
  aiCopied         = false;
  aiHealthScores: { label: string; value: string; status: 'normal' | 'warning' | 'danger' }[] = [];
  followUpQuestions: string[] = [];

  // ── Evolution Charts ─────────────────────────────────
  showEvolutionPopup = false;
  evoStats: any = {};

  @ViewChild('bpChart')     bpChartRef!: ElementRef;
  @ViewChild('weightChart') weightChartRef!: ElementRef;
  @ViewChild('hrChart')     hrChartRef!: ElementRef;
  @ViewChild('o2Chart')     o2ChartRef!: ElementRef;
  @ViewChild(MatPaginator)  paginator!: MatPaginator;
  @ViewChild(MatSort)        sort!: MatSort;

  private evoCharts: Chart[] = [];

  constructor(
    private vitalsService: VitalsService,
    private pregnancyService: PregnancyService,
    private alertBadge: AlertBadgeService,
    private examBadge: ExamBadgeService,
    private fb: FormBuilder,
    private http: HttpClient,
    private ngZone: NgZone // Added NgZone
  ) {
    this.vitalForm = this.fb.group({
      systolicBp:   [null, [Validators.required, Validators.min(50),  Validators.max(250)]],
      diastolicBp:  [null, [Validators.required, Validators.min(30),  Validators.max(150)]],
      weightKg:     [null, [Validators.required, Validators.min(30),  Validators.max(200)]],
      heartRate:    [null, [Validators.required, Validators.min(40),  Validators.max(200)]],
      glucoseMmol:  [null],
      temperatureC: [null],
      oxygenPct:    [null],
      notes:        [''],
      source:       ['MANUAL'],
    });
    this.editForm = this.fb.group({
      systolicBp:   [null, [Validators.required, Validators.min(50),  Validators.max(250)]],
      diastolicBp:  [null, [Validators.required, Validators.min(30),  Validators.max(150)]],
      weightKg:     [null, [Validators.required, Validators.min(30),  Validators.max(200)]],
      heartRate:    [null, [Validators.required, Validators.min(40),  Validators.max(200)]],
      glucoseMmol:  [null],
      temperatureC: [null],
      oxygenPct:    [null],
      notes:        [''],
    });
  }

  ngOnInit() {
    this.loadVitals();
    this.pregnancyService.getMyPregnancies().subscribe({
      next: (list) => {
        const active = list.find(p => p.status === 'ACTIVE');
        this.hasActivePregnancy = !!active;
        if (active) {
          this.pregnancyId = active.id;
          const lmp = new Date(active.lmpDate);
          const today = new Date();
          const diffDays = Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
          this.currentPregnancyWeek = Math.min(40, Math.max(1, Math.floor(diffDays / 7)));
        }      
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort      = this.sort;
  }

  ngOnDestroy() { 
    this.destroyEvoCharts(); 
  }

  loadVitals() {
    this.loading = true;
    this.vitalsService.getMyVitals().subscribe({
      next: (vitals) => {
        this.dataSource.data = vitals;
        if (vitals.length > 0) this.latestVital = vitals[0];
        this.loading = false;
      },
      error: (err) => {
        console.error("Failed to load data:", err);
        this.loading = false; 
      }
    });
  }

  openForm() {
    if (!this.hasActivePregnancy) { this.showNoPregnancyAlert = true; return; }
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.vitalForm.reset({ source: 'MANUAL' });
    this.mlResult = null;
    this.mlLoading = false;
  }

  save() {
    if (this.vitalForm.invalid) return;
    this.saving = true;

    const payload = {
      ...this.vitalForm.value,
      ...(this.mlResult && !this.mlResult.error ? {
        mlRiskLevel: this.mlResult.risk_level,
        mlRiskScore: this.mlResult.risk_score,
      } : {})
    };

    this.vitalsService.saveVital(payload, this.pregnancyId).subscribe({
      next: () => {
        this.saving = false;
        this.closeForm();
        this.loadVitals();
        this.alertBadge.refresh();
        this.examBadge.refresh();
      },
      error: () => { this.saving = false; }
    });
  }

  openEditForm(vital: Vitals) {
    this.selectedVital = vital;
    this.editForm.patchValue({
      systolicBp: vital.systolicBp, diastolicBp: vital.diastolicBp,
      weightKg: vital.weightKg, heartRate: vital.heartRate,
      glucoseMmol: vital.glucoseMmol, temperatureC: vital.temperatureC,
      oxygenPct: vital.oxygenPct, notes: vital.notes || '',
    });
    this.showEditForm = true;
  }

  closeEditForm() { 
    this.showEditForm = false; 
    this.selectedVital = null; 
    this.editForm.reset(); 
  }

  saveEdit() {
    if (this.editForm.invalid || !this.selectedVital) return;
    this.saving = true;
    this.vitalsService.updateVital(this.selectedVital.id, this.editForm.value).subscribe({
      next: () => { 
        this.saving = false; 
        this.closeEditForm(); 
        this.loadVitals(); 
        this.alertBadge.refresh(); 
        this.examBadge.refresh(); 
      },
      error: () => { this.saving = false; }
    });
  }

  deleteVital(vital: Vitals) {
    this.vitalToDelete = vital;
    this.showDeleteVitalConfirm = true;
  }

  confirmDeleteVital() {
    if (!this.vitalToDelete) return;
    this.showDeleteVitalConfirm = false;
    this.vitalsService.deleteVital(this.vitalToDelete.id).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter(v => v.id !== this.vitalToDelete!.id);
        this.latestVital = this.dataSource.data.length > 0 ? this.dataSource.data[0] : null;
        this.vitalToDelete = null;
        this.alertBadge.refresh(); this.examBadge.refresh();
      },
      error: () => { this.vitalToDelete = null; }
    });
  }

  // ══════════════════════════════════════════════════════
  // EVOLUTION POPUP
  // ══════════════════════════════════════════════════════
  openEvolution() {
    this.showEvolutionPopup = true;
    // Increased timeout and safety check
    setTimeout(() => {
      if (this.showEvolutionPopup) {
        this.buildEvoCharts();
      }
    }, 300);
  }

  closeEvolution() {
    this.showEvolutionPopup = false;
    this.destroyEvoCharts();
    this.evoStats = {};
  }

  private destroyEvoCharts() {
    if (this.evoCharts.length > 0) {
      this.evoCharts.forEach(c => c.destroy());
      this.evoCharts = [];
    }
  }

  getChartStats(values: number[]): { min: number; max: number; avg: number; trend: string; trendColor: string } {
    const clean = values.filter(v => v != null && v > 0);
    if (clean.length === 0) return { min: 0, max: 0, avg: 0, trend: '—', trendColor: '#9b8fa8' };
    const min  = Math.min(...clean);
    const max  = Math.max(...clean);
    const avg  = Math.round(clean.reduce((a, b) => a + b, 0) / clean.length);
    const diff = clean[clean.length - 1] - clean[0];
    const trend      = diff > 0 ? `↑ +${diff.toFixed(1)}` : diff < 0 ? `↓ ${diff.toFixed(1)}` : '→ Stable';
    const trendColor = diff > 2 ? '#e53935' : diff < -2 ? '#43a047' : '#ff9800';
    return { min, max, avg, trend, trendColor };
  }

  getBpMessage(systolic: number[], diastolic: number[]): string {
    const ls = systolic[systolic.length - 1];
    const ld = diastolic[diastolic.length - 1];
    if (ls >= 160 || ld >= 110) return '🚨 Critical hypertension detected. Please contact your doctor immediately.';
    if (ls >= 140 || ld >= 90)  return '⚠️ High blood pressure. Rest, lie on your left side and monitor closely.';
    if (ls >= 130 || ld >= 80)  return '💛 Borderline blood pressure. Reduce salt and stress, and inform your doctor.';
    return '✅ Your blood pressure is in the normal range. Excellent — keep it up, mama!';
  }

  getHrMessage(hr: number[]): string {
    const last = hr[hr.length - 1];
    if (last > 120) return '🚨 Heart rate critically elevated. Sit down, breathe slowly, and call your doctor.';
    if (last > 100) return '⚠️ Slightly elevated heart rate. Rest and avoid caffeine and stress.';
    if (last < 50)  return '⚠️ Heart rate too low (bradycardia). Consult your doctor if you feel dizzy.';
    return '✅ Heart rate is perfectly normal for pregnancy. Your heart is working beautifully!';
  }

  getO2Message(o2: number[]): string {
    if (o2.length === 0) return '💡 No oxygen data recorded yet. Add a measurement to see your stats.';
    const last = o2[o2.length - 1];
    if (last < 92) return '🚨 Critically low oxygen! Call emergency services immediately and breathe slowly.';
    if (last < 95) return '⚠️ Low oxygen saturation. Sit upright, open a window and breathe deeply.';
    return '✅ Oxygen saturation is healthy. Your baby is receiving plenty of oxygen!';
  }

  private buildEvoCharts() {
    // Run chart creation outside Angular zone to prevent freezing/lag
    this.ngZone.runOutsideAngular(() => {
      this.destroyEvoCharts();

      const data   = [...this.dataSource.data].reverse().slice(-10);
      const labels = data.map(v => {
        const d = new Date(v.measuredAt);
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
      });

      const systolic  = data.map(v => v.systolicBp);
      const diastolic = data.map(v => v.diastolicBp);
      const weight    = data.map(v => v.weightKg);
      const hr        = data.map(v => v.heartRate);
      const o2Raw     = data.map(v => v.oxygenPct ?? null) as (number|null)[];
      const o2Clean   = o2Raw.filter(v => v != null && v > 0) as number[];

      // Sync specific data back to Angular UI context
      this.ngZone.run(() => {
        this.evoStats = {
          bpSStats : this.getChartStats(systolic),
          bpDStats : this.getChartStats(diastolic),
          wStats   : this.getChartStats(weight),
          hrStats  : this.getChartStats(hr),
          o2Stats  : this.getChartStats(o2Clean),
          bpMsg    : this.getBpMessage(systolic, diastolic),
          hrMsg    : this.getHrMessage(hr),
          o2Msg    : this.getO2Message(o2Clean),
        };
      });

      const getBpColor = (s: number[], d: number[]) => {
        const ls = s[s.length-1], ld = d[d.length-1];
        if (ls >= 160 || ld >= 110) return '#e53935';
        if (ls >= 140 || ld >= 90)  return '#ff9800';
        return '#c94d6a';
      };
      
      const getHrColor = (hr: number[]) => {
        const l = hr[hr.length-1];
        return (l > 120 || l < 50) ? '#e53935' : l > 100 ? '#ff9800' : '#4d8c52';
      };

      const getO2Color = (o2: number[]) => {
        if (!o2.length) return '#3a8fb5';
        const l = o2[o2.length-1];
        return l < 92 ? '#e53935' : l < 95 ? '#ff9800' : '#3a8fb5';
      };

      const baseOpts = (color: string) => ({
        responsive: true,
        maintainAspectRatio: true, // Set to true for stability
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(30,18,21,0.88)',
            titleFont: { family: "'Playfair Display', serif", size: 12 },
            bodyFont:  { family: "'DM Sans', sans-serif", size: 11 },
            padding: 10, cornerRadius: 10,
            callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.raw}` }
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#9b8fa8', font: { size: 9 }, maxTicksLimit: 6 } },
          y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#9b8fa8', font: { size: 9 } }, beginAtZero: false }
        },
        elements: { point: { radius: 4, hoverRadius: 7, borderWidth: 2 }, line: { borderWidth: 2.5 } },
        animation: { duration: 900, easing: 'easeInOutQuart' as const }
      });

      const mkDs = (d: (number|null)[], color: string, label: string, dashed = false) => ({
        label, data: d,
        borderColor: color,
        backgroundColor: dashed ? 'transparent' : color + '15',
        fill: !dashed, tension: dashed ? 0 : 0.4,
        borderDash: dashed ? [5, 3] : [], borderWidth: dashed ? 1.5 : 2.5,
        pointRadius: dashed ? 0 : 4, pointHoverRadius: dashed ? 0 : 7,
        pointBackgroundColor: color, pointBorderColor: '#fff', pointBorderWidth: 2,
      });

      const bpColor = getBpColor(systolic, diastolic);
      const hrColor = getHrColor(hr);
      const o2Color = getO2Color(o2Clean);

      // BP Chart
      if (this.bpChartRef?.nativeElement) {
        this.evoCharts.push(new Chart(this.bpChartRef.nativeElement, {
          type: 'line',
          data: { labels, datasets: [
            mkDs(systolic,  bpColor,    'Systolic (mmHg)'),
            mkDs(diastolic, '#a8722e',  'Diastolic (mmHg)'),
            mkDs(Array(labels.length).fill(130), '#ff980080', 'Limit 130', true) as any,
            mkDs(Array(labels.length).fill(80),  '#43a04780', 'Limit 80',  true) as any,
          ]},
          options: baseOpts(bpColor)
        }));
      }

      // Weight Chart
      if (this.weightChartRef?.nativeElement) {
        this.evoCharts.push(new Chart(this.weightChartRef.nativeElement, {
          type: 'line',
          data: { labels, datasets: [mkDs(weight, '#a8722e', 'Weight (kg)')] },
          options: baseOpts('#a8722e')
        }));
      }

      // Heart Rate Chart
      if (this.hrChartRef?.nativeElement) {
        this.evoCharts.push(new Chart(this.hrChartRef.nativeElement, {
          type: 'line',
          data: { labels, datasets: [
            mkDs(hr, hrColor, 'Heart Rate (bpm)'),
            mkDs(Array(labels.length).fill(100), '#ff980080', 'Max 100', true) as any,
            mkDs(Array(labels.length).fill(60),  '#43a04780', 'Min 60',  true) as any,
          ]},
          options: baseOpts(hrColor)
        }));
      }

      // O2 Chart
      if (this.o2ChartRef?.nativeElement) {
        this.evoCharts.push(new Chart(this.o2ChartRef.nativeElement, {
          type: 'line',
          data: { labels, datasets: [
            mkDs(o2Raw, o2Color, 'O₂ (%)'),
            mkDs(Array(labels.length).fill(95), '#ff980080', 'Min 95%', true) as any,
          ]},
          options: {
            ...baseOpts(o2Color),
            scales: {
              x: { grid: { display: false }, ticks: { color: '#9b8fa8', font: { size: 9 } } },
              y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#9b8fa8', font: { size: 9 } }, min: 85, max: 100 }
            }
          }
        }));
      }
    });
  }

  // ══════════════════════════════════════════════════════
  // AI ANALYSIS
  // ══════════════════════════════════════════════════════
  async analyzeVitals() {
    const last10 = this.dataSource.data.slice(0, 10);
    if (last10.length === 0) return;

    this.showAiPopup = true; 
    this.aiLoading = true;
    this.aiAnalysis = ''; 
    this.aiHealthScores = []; 
    this.followUpQuestions = []; 
    this.aiCopied = false;

    const latest   = last10[0];
    const bpStatus = this.getBloodPressureStatus(latest.systolicBp, latest.diastolicBp);
    const hrStatus: 'normal' | 'warning' | 'danger' =
      latest.heartRate > 120 ? 'danger' : latest.heartRate > 100 ? 'warning' : 'normal';
    const o2Status: 'normal' | 'warning' | 'danger' =
      !latest.oxygenPct ? 'normal' : latest.oxygenPct < 94 ? 'danger' : latest.oxygenPct < 96 ? 'warning' : 'normal';

    this.aiHealthScores = [
      { label: 'Blood Pressure', value: `${latest.systolicBp}/${latest.diastolicBp}`,
        status: bpStatus === 'danger' ? 'danger' : bpStatus === 'warning' ? 'warning' : 'normal' },
      { label: 'Weight',        value: `${latest.weightKg} kg`,        status: 'normal' },
      { label: 'Heart Rate',    value: `${latest.heartRate} bpm`,       status: hrStatus },
      { label: 'O₂ Saturation', value: `${latest.oxygenPct ?? '--'}%`,  status: o2Status },
    ];

    this.http.post<any>(`${environment.apiUrl}/ai/analyze-vitals`, last10.map(v => ({
      measuredAt: v.measuredAt, systolicBp: v.systolicBp, diastolicBp: v.diastolicBp,
      weightKg: v.weightKg, heartRate: v.heartRate,
      oxygenPct: v.oxygenPct ?? null, temperatureC: v.temperatureC ?? null, glucoseMmol: v.glucoseMmol ?? null,
    }))).subscribe({
      next: (data) => {
        this.aiAnalysis = data.analysis || 'Unable to generate analysis.';
        this.followUpQuestions = [];
        if (bpStatus !== 'normal') this.followUpQuestions.push('What should I do if my blood pressure stays high?');
        if (hrStatus !== 'normal') this.followUpQuestions.push('Is my heart rate too high for pregnancy?');
        if (o2Status !== 'normal') this.followUpQuestions.push('What does low oxygen saturation mean during pregnancy?');
        this.followUpQuestions.push('What are the warning signs I should never ignore?');
        if (this.followUpQuestions.length < 3) this.followUpQuestions.push('How can I improve my vitals naturally during pregnancy?');
        this.aiLoading = false;
      },
      error: (err) => {
        console.error("AI Analysis Error:", err);
        this.aiAnalysis = 'An error occurred. Please check your connection and try again.';
        this.aiLoading = false;
      }
    });
  }

  async askFollowUp(question: string) {
    this.aiFollowLoading = true; 
    this.aiAnalysis = '';
    this.http.post<any>(`${environment.apiUrl}/ai/analyze-vitals`, [{ followUp: question }]).subscribe({
      next: (data) => {
        this.aiAnalysis = data.analysis || 'Unable to answer.';
        this.aiFollowLoading = false;
      },
      error: (err) => {
        console.error("Follow up Error:", err);
        this.aiAnalysis = 'An error occurred. Please try again.';
        this.aiFollowLoading = false;
      }
    });
  }

  copyAnalysis() {
    navigator.clipboard.writeText(this.aiAnalysis).then(() => {
      this.aiCopied = true;
      setTimeout(() => this.aiCopied = false, 2000);
    });
  }

  closeAiPopup() {
    this.showAiPopup = false; 
    this.aiAnalysis = ''; 
    this.aiLoading = false;
    this.aiFollowLoading = false; 
    this.aiHealthScores = []; 
    this.followUpQuestions = []; 
    this.aiCopied = false;
  }

  getBloodPressureStatus(s: number, d: number): string {
    if (s >= 140 || d >= 90) return 'danger';
    if (s >= 130 || d >= 80) return 'warning';
    return 'normal';
  }

  getBloodPressureLabel(s: number, d: number): string {
    const st = this.getBloodPressureStatus(s, d);
    return st === 'danger' ? 'Hypertension' : st === 'warning' ? 'Borderline' : 'Normal';
  }

  getScoreColor(status: string): string {
    return status === 'danger' ? '#f44336' : status === 'warning' ? '#ff9800' : '#4caf50';
  }

  getScoreLabel(status: string): string {
    return status === 'danger' ? 'Critical' : status === 'warning' ? 'Attention' : 'Normal';
  }

  applyFilter(event: Event) {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  async analyzeWithML() {
    this.mlLoading = true;
    this.mlResult = null;

    const form = this.vitalForm.value;
    const payload = {
      systolic_bp:    form.systolicBp,
      diastolic_bp:   form.diastolicBp,
      heart_rate:     form.heartRate,
      weight_kg:      form.weightKg,
      pregnancy_week: this.currentPregnancyWeek || 20,
      oxygen_pct:     form.oxygenPct     || null,
      glucose_mmol:   form.glucoseMmol   || null,
      temperature_c:  form.temperatureC  || null,
    };

    this.http.post<any>(`${environment.apiUrl}/vitals/ml/predict`, payload).subscribe({
      next: (res) => {
        this.mlResult = res;
        this.mlLoading = false;
      },
      error: (err) => {
        console.error('ML prediction failed', err);
        this.mlResult = { error: true };
        this.mlLoading = false;
      }
    });
  }
}