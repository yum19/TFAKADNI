import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { Chart, registerables } from 'chart.js';
import { Alert, Pregnancy, Vitals } from '../../../core/models/pregnancy.model';
import { PregnancyService } from '../../../core/services/pregnancy.service';
import { VitalsService } from '../../../core/services/vitals.service';
import { AlertsService } from '../../../core/services/alerts.service';
import { FetalMilestoneService } from '../../../core/services/fetal-milestone.service';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatDividerModule, MatTableModule,
    MatChipsModule, RouterModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('alertsChart')     alertsChartRef!: ElementRef;
  @ViewChild('pregnancyChart')  pregnancyChartRef!: ElementRef;
  @ViewChild('vitalsChart')     vitalsChartRef!: ElementRef;
  @ViewChild('milestonesChart') milestonesChartRef!: ElementRef;

  private charts: Chart[] = [];
  private admin = inject(AdminService);

  // ── Platform stats (from AdminService) ──────────────────────
  courses  = 0;
  guides   = 0;

  // ── Pregnancy stats ──────────────────────────────────────────
  totalGrossesses    = 0;
  grossessesActives  = 0;
  totalAlertes       = 0;
  alertesCritiques   = 0;
  totalVitals        = 0;
  totalMilestones    = 0;

  get activeRate(): number {
    return this.totalGrossesses ? Math.round((this.grossessesActives / this.totalGrossesses) * 100) : 0;
  }
  get criticalRate(): number {
    return this.totalAlertes ? Math.round((this.alertesCritiques / this.totalAlertes) * 100) : 0;
  }
  get milestonesRate(): number {
    return Math.round((this.totalMilestones / 40) * 100);
  }

  // ── Lists ────────────────────────────────────────────────────
  dernieresGrossesses: Pregnancy[]  = [];
  alertesCritiquesListe: Alert[]    = [];
  derniersVitals: Vitals[]          = [];

  // ── Raw data ─────────────────────────────────────────────────
  private allAlerts:      Alert[]     = [];
  private allVitals:      Vitals[]    = [];
  private allPregnancies: Pregnancy[] = [];

  loading    = true;
  dataLoaded = false;

  // ── Strategic content ────────────────────────────────────────
  readonly pillars = [
    {
      title: 'Situational Education',
      desc:  'Prioritize content that addresses real-time pregnancy challenges over purely academic theory.'
    },
    {
      title: 'Bitesize Retention',
      desc:  'Ensure every learning block is short enough to be consumed and retained during high-stress moments.'
    },
    {
      title: 'Positive Reinforcement',
      desc:  'Quizzes must be designed as tools for confidence building and knowledge solidifying, not testing.'
    },
    {
      title: 'Emotional Intelligence',
      desc:  'Partner guides must maintain a balance between practical logistics and deep empathy.'
    },
  ];

  readonly launchChecklist = [
    'Seed clinical datasets',
    'Validate 3 Core Courses',
    'Sync Module Quizzes',
    'Publish Partner Guides',
    'Audit AI Summary Logic',
  ];

  // ── Lifecycle ────────────────────────────────────────────────
  ngOnInit()        { this.loadData(); }
  ngAfterViewInit() { if (this.dataLoaded) this.buildCharts(); }
  ngOnDestroy()     { this.charts.forEach(c => c.destroy()); }

  loadData() {
    this.loading = true;

    // Platform content counters
    this.admin.getCourses().subscribe({ next: data => (this.courses = data.length) });
    this.admin.getGuides().subscribe({  next: data => (this.guides  = data.length) });

    // Pregnancy data (4 parallel calls)
    let done = 0;
    const check = () => {
      done++;
      if (done === 4) {
        this.loading    = false;
        this.dataLoaded = true;
        setTimeout(() => this.buildCharts(), 100);
      }
    };

    this.pregnancyService.getAllPregnanciesAdmin().subscribe({
      next: (list) => {
        this.allPregnancies      = list;
        this.totalGrossesses     = list.length;
        this.grossessesActives   = list.filter(p => p.status === 'ACTIVE').length;
        this.dernieresGrossesses = list.slice(-5).reverse();
        check();
      }, error: () => check()
    });

    this.alertsService.getAllAlertsAdmin().subscribe({
      next: (list) => {
        this.allAlerts           = list;
        this.totalAlertes        = list.length;
        this.alertesCritiques    = list.filter(a => a.severity === 'CRITICAL').length;
        this.alertesCritiquesListe = list.filter(a => a.severity === 'CRITICAL').slice(0, 4);
        check();
      }, error: () => check()
    });

    this.vitalsService.getAllVitalsAdmin().subscribe({
      next: (list) => {
        this.allVitals      = list;
        this.totalVitals    = list.length;
        this.derniersVitals = list.slice(0, 6);
        check();
      }, error: () => check()
    });

    this.fetalService.getAllAdmin().subscribe({
      next: (list) => { this.totalMilestones = list.length; check(); },
      error: () => check()
    });
  }

  // ── Charts ───────────────────────────────────────────────────
  buildCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    this.buildAlertsChart();
    this.buildPregnancyChart();
    this.buildVitalsChart();
    this.buildMilestonesChart();
  }

  private buildAlertsChart() {
    const el = this.alertsChartRef?.nativeElement;
    if (!el) return;
    const counts = {
      INFO:     this.allAlerts.filter(a => a.severity === 'INFO').length,
      WARNING:  this.allAlerts.filter(a => a.severity === 'WARNING').length,
      DANGER:   this.allAlerts.filter(a => a.severity === 'DANGER').length,
      CRITICAL: this.allAlerts.filter(a => a.severity === 'CRITICAL').length,
    };
    this.charts.push(new Chart(el, {
      type: 'doughnut',
      data: {
        labels: ['Info', 'Warning', 'Danger', 'Critical'],
        datasets: [{
          data: [counts.INFO, counts.WARNING, counts.DANGER, counts.CRITICAL],
          backgroundColor: [
            'rgba(58,143,181,0.85)',
            'rgba(168,114,46,0.85)',
            'rgba(217,123,88,0.85)',
            'rgba(201,77,106,0.85)',
          ],
          borderColor: 'rgba(255,255,255,0.8)',
          borderWidth: 2,
          hoverOffset: 8,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}` } }
        },
        animation: { duration: 900, easing: 'easeInOutQuart' }
      }
    }));
  }

  private buildPregnancyChart() {
    const el = this.pregnancyChartRef?.nativeElement;
    if (!el) return;
    const statusCounts: any = { ACTIVE: 0, COMPLETED: 0, MISCARRIAGE: 0, TERMINATED: 0 };
    this.allPregnancies.forEach(p => { if (statusCounts[p.status] !== undefined) statusCounts[p.status]++; });
    this.charts.push(new Chart(el, {
      type: 'bar',
      data: {
        labels: ['Active', 'Completed', 'Miscarriage', 'Terminated'],
        datasets: [{
          data: [statusCounts.ACTIVE, statusCounts.COMPLETED, statusCounts.MISCARRIAGE, statusCounts.TERMINATED],
          backgroundColor: [
            'rgba(77,140,82,0.75)',
            'rgba(58,143,181,0.75)',
            'rgba(168,114,46,0.75)',
            'rgba(201,77,106,0.75)',
          ],
          borderRadius: 12, borderSkipped: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#7a5c65', font: { size: 11, family: "'DM Sans', sans-serif" } }
          },
          y: {
            grid: { color: 'rgba(201,77,106,0.06)' },
            ticks: { color: '#7a5c65', stepSize: 1, font: { size: 11 } },
            beginAtZero: true
          }
        },
        animation: { duration: 900, easing: 'easeInOutQuart' }
      }
    }));
  }

  private buildVitalsChart() {
    const el = this.vitalsChartRef?.nativeElement;
    if (!el) return;
    const last10 = this.allVitals.slice(0, 10).reverse();
    const labels  = last10.map((_, i) => `V${i + 1}`);
    this.charts.push(new Chart(el, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Systolic',
            data: last10.map(v => v.systolicBp),
            borderColor: 'rgba(201,77,106,0.9)',
            backgroundColor: 'rgba(201,77,106,0.08)',
            fill: true, tension: 0.4, pointRadius: 4,
            pointBackgroundColor: '#c94d6a',
            pointBorderColor: '#fff', pointBorderWidth: 2,
          },
          {
            label: 'Diastolic',
            data: last10.map(v => v.diastolicBp),
            borderColor: 'rgba(168,114,46,0.9)',
            backgroundColor: 'rgba(168,114,46,0.06)',
            fill: true, tension: 0.4, pointRadius: 4,
            pointBackgroundColor: '#a8722e',
            pointBorderColor: '#fff', pointBorderWidth: 2,
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: { color: '#4a3038', font: { size: 11, family: "'DM Sans', sans-serif" } }
          },
          tooltip: {
            backgroundColor: 'rgba(30,18,21,0.85)',
            titleFont: { family: "'Playfair Display', serif", size: 12 },
            bodyFont:  { family: "'DM Sans', sans-serif", size: 11 },
            padding: 10, cornerRadius: 10,
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#7a5c65', font: { size: 10 } } },
          y: {
            grid: { color: 'rgba(201,77,106,0.06)' },
            ticks: { color: '#7a5c65', font: { size: 10 } },
            beginAtZero: false
          }
        },
        animation: { duration: 900, easing: 'easeInOutQuart' }
      }
    }));
  }

  private buildMilestonesChart() {
    const el = this.milestonesChartRef?.nativeElement;
    if (!el) return;
    const configured = this.totalMilestones;
    const missing    = 40 - configured;
    this.charts.push(new Chart(el, {
      type: 'doughnut',
      data: {
        labels: ['Configured', 'Missing'],
        datasets: [{
          data: [configured, missing],
          backgroundColor: ['rgba(77,140,82,0.85)', 'rgba(200,230,202,0.4)'],
          borderColor: ['rgba(77,140,82,0.5)', 'rgba(200,230,202,0.3)'],
          borderWidth: 2, hoverOffset: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '75%',
        plugins: { legend: { display: false } },
        animation: { duration: 900, easing: 'easeInOutQuart' }
      }
    }));
  }

  // ── Helpers ──────────────────────────────────────────────────
  getStatutColor(s: string): string {
    return ({ ACTIVE: '#4d8c52', COMPLETED: '#3a8fb5', MISCARRIAGE: '#a8722e', TERMINATED: '#c94d6a' } as any)[s] || '#999';
  }
  getStatutLabel(s: string): string {
    return ({ ACTIVE: 'Active', COMPLETED: 'Completed', MISCARRIAGE: 'Miscarriage', TERMINATED: 'Terminated' } as any)[s] || s;
  }
  getSeverityColor(s: string): string {
    return ({ INFO: '#3a8fb5', WARNING: '#a8722e', DANGER: '#d97b58', CRITICAL: '#c94d6a' } as any)[s] || '#999';
  }
  getSeverityIcon(s: string): string {
    return ({ INFO: 'info', WARNING: 'warning', DANGER: 'error', CRITICAL: 'crisis_alert' } as any)[s] || 'notifications';
  }
  getTensionStatus(s: number, d: number): string {
    if (s >= 140 || d >= 90) return 'danger';
    if (s >= 130 || d >= 80) return 'warning';
    return 'normal';
  }

  // ── DI (kept as constructor for clarity) ────────────────────
  constructor(
    private pregnancyService: PregnancyService,
    private vitalsService: VitalsService,
    private alertsService: AlertsService,
    private fetalService: FetalMilestoneService,
  ) {}
}