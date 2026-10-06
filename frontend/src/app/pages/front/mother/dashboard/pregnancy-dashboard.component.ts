import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { FetalMilestone, Pregnancy, PrenatalExam, Vitals } from '../../../../core/models/pregnancy.model';
import { PregnancyService } from '../../../../core/services/pregnancy.service';
import { VitalsService } from '../../../../core/services/vitals.service';
import { AlertsService } from '../../../../core/services/alerts.service';
import { FetalMilestoneService } from '../../../../core/services/fetal-milestone.service';
import { PrenatalExamService } from '../../../../core/services/prenatal-exam.service';

@Component({
  selector: 'app-femme-pregnancy-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatFormFieldModule, MatInputModule, FormsModule,
  ],
  templateUrl: './pregnancy-dashboard.html',
  styleUrl: './pregnancy-dashboard.scss',
  encapsulation: ViewEncapsulation.None,
})
export class PregnancyDashboardComponent implements OnInit, OnDestroy, AfterViewInit {

  // ── Pregnancy ──────────────────────────────────
  pregnancy: Pregnancy | null = null;
  currentWeek      = 0;
  currentTrimester = 0;
  pregnancyProgress  = 0;
  trimester2Progress = 0;
  Math = Math;

  // ── Vitals ─────────────────────────────────────
  latestVitals: Vitals | null = null;
  bloodPressure = '--/--';
  currentWeight = 0;

  // ── Alerts ─────────────────────────────────────
  unreadAlerts   = 0;
  criticalAlerts = 0;

  // ── Fetal ──────────────────────────────────────
  fetalInfo: FetalMilestone | null = null;

  // ── Exams ──────────────────────────────────────
  dataSource = new MatTableDataSource<PrenatalExam>([]);
  displayedColumns: string[] = ['examName', 'examType', 'recommendedWeek', 'done'];

  // ── Countdown ──────────────────────────────────
  daysLeft     = 0;
  hoursLeft    = 0;
  minutesLeft  = 0;
  secondsLeft  = 0;
  countdownPct = 0;
  isUrgent     = false;
  isSoon       = false;
  isBirthDay   = false;
  private countdownInterval: any;

  // ── Milestones ─────────────────────────────────
  milestones = [
    { week: 8,  title: 'First heartbeat',       reached: false },
    { week: 12, title: 'End of T1',             reached: false },
    { week: 16, title: 'Baby movements',        reached: false },
    { week: 20, title: 'Morphology ultrasound', reached: false },
    { week: 24, title: 'Viability',             reached: false },
    { week: 28, title: 'Start of T3',           reached: false },
    { week: 32, title: 'Baby position',         reached: false },
    { week: 40, title: 'Birth',                 reached: false },
  ];

  loading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;

  constructor(
    private pregnancyService: PregnancyService,
    private vitalsService:    VitalsService,
    private alertsService:    AlertsService,
    private fetalService:     FetalMilestoneService,
    private examService:      PrenatalExamService,
  ) {}

  ngOnInit()    { this.loadData(); }
  ngOnDestroy() { if (this.countdownInterval) clearInterval(this.countdownInterval); }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort      = this.sort;
  }

  loadData() {
    this.pregnancyService.getActivePregnancy().subscribe({
      next: (pregnancy) => {
        this.pregnancy = pregnancy;
        this.calculateWeek(pregnancy);
        this.startCountdown(pregnancy.dueDate);

        this.vitalsService.getLatestVital().subscribe({
          next:  (vital) => {
            this.latestVitals = vital;
            if (vital) {
              this.bloodPressure = `${vital.systolicBp}/${vital.diastolicBp}`;
              this.currentWeight = vital.weightKg;
            }
          },
          error: () => {}
        });

        this.examService.getExamsByPregnancy(pregnancy.id).subscribe({
          next:  (exams) => { this.dataSource.data = exams; },
          error: (err) => {
              console.error('Error fetching prenatal exams:', err);
          }
        });

        this.fetalService.getByWeek(this.currentWeek).subscribe({
          next:  (info) => { this.fetalInfo = info; },
          error: (err) => {
              console.error('Error fetching fetal info:', err);
              this.fetalInfo = null;
          }
        });
      },
      error: () => { this.loading = false; }
    });

    this.alertsService.getUnreadAlerts().subscribe({
      next: (alerts) => {
        this.unreadAlerts   = alerts.length;
        this.criticalAlerts = alerts.filter((a: any) => a.severity === 'CRITICAL').length;
        this.loading        = false;
      },
      error: () => { this.loading = false; }
    });
  }

  calculateWeek(pregnancy: Pregnancy) {
    const start = new Date(pregnancy.lmpDate);
    const today = new Date();
    const diff  = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
    this.currentWeek       = Math.min(diff, 40);
    this.currentTrimester  = this.currentWeek <= 12 ? 1 : this.currentWeek <= 26 ? 2 : 3;
    this.pregnancyProgress = Math.round((this.currentWeek / 40) * 100);
    this.trimester2Progress = this.currentWeek > 12
      ? Math.min(Math.round(((this.currentWeek - 12) / 14) * 100), 100) : 0;
    this.milestones = this.milestones.map(m => ({ ...m, reached: this.currentWeek >= m.week }));
  }

  // ── Countdown ──────────────────────────────────
  startCountdown(dueDate: string) {
    const due     = new Date(dueDate);
    const lmp     = this.pregnancy?.lmpDate ? new Date(this.pregnancy.lmpDate) : null;
    const totalMs = lmp ? due.getTime() - lmp.getTime() : 280 * 24 * 60 * 60 * 1000;

    const tick = () => {
      const now    = new Date();
      const diffMs = due.getTime() - now.getTime();

      if (diffMs <= 0) {
        this.daysLeft = this.hoursLeft = this.minutesLeft = this.secondsLeft = 0;
        this.countdownPct = 100;
        this.isBirthDay   = true;
        clearInterval(this.countdownInterval);
        return;
      }

      this.daysLeft    = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      this.hoursLeft   = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      this.minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      this.secondsLeft = Math.floor((diffMs % (1000 * 60)) / 1000);
      this.isUrgent    = this.daysLeft < 14;
      this.isSoon      = this.daysLeft < 30;
      this.isBirthDay  = false;

      const elapsed     = totalMs - diffMs;
      this.countdownPct = Math.min(Math.round((elapsed / totalMs) * 100), 100);
    };

    tick();
    this.countdownInterval = setInterval(tick, 1000);
  }

  getCountdownColor(): string {
    if (this.isBirthDay || this.isUrgent) return '#c94d6a';
    if (this.isSoon)                      return '#d97b58';
    return '#4d8c52';
  }

  getCountdownBg(): string {
    if (this.isBirthDay || this.isUrgent) return 'rgba(201,77,106,0.07)';
    if (this.isSoon)                      return 'rgba(217,123,88,0.07)';
    return 'rgba(77,140,82,0.07)';
  }

  getCountdownTrack(): string {
    if (this.isBirthDay || this.isUrgent) return 'rgba(201,77,106,0.15)';
    if (this.isSoon)                      return 'rgba(217,123,88,0.15)';
    return 'rgba(77,140,82,0.15)';
  }

  getCountdownEmoji(): string {
    if (this.isBirthDay) return '🎉';
    if (this.isUrgent)   return '👶';
    if (this.isSoon)     return '🌸';
    return '✨';
  }

  getCountdownMessage(): string {
    if (this.isBirthDay)       return 'Your baby is arriving today!';
    if (this.daysLeft === 1)   return 'Tomorrow is the big day!';
    if (this.isUrgent)         return 'Very soon now — get ready!';
    if (this.isSoon)           return 'Almost there, mama!';
    if (this.daysLeft < 60)    return 'The wait is almost over';
    return 'Your baby is growing beautifully';
  }


  // ── Signe astrologique ─────────────────────────────
  getBabyZodiac(): { sign: string; symbol: string; emoji: string } {
    if (!this.pregnancy?.dueDate) return { sign: 'Unknown', symbol: '?', emoji: '⭐' };
    const d = new Date(this.pregnancy.dueDate);
    const month = d.getMonth() + 1;
    const day   = d.getDate();
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19))  return { sign: 'Aries',       symbol: '♈', emoji: '🐏' };
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20))  return { sign: 'Taurus',      symbol: '♉', emoji: '🐂' };
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20))  return { sign: 'Gemini',      symbol: '♊', emoji: '👯' };
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22))  return { sign: 'Cancer',      symbol: '♋', emoji: '🦀' };
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22))  return { sign: 'Leo',         symbol: '♌', emoji: '🦁' };
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22))  return { sign: 'Virgo',       symbol: '♍', emoji: '🌾' };
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { sign: 'Libra',       symbol: '♎', emoji: '⚖️' };
    if ((month === 10 && day >= 23)||(month === 11 && day <= 21))  return { sign: 'Scorpio',     symbol: '♏', emoji: '🦂' };
    if ((month === 11 && day >= 22)||(month === 12 && day <= 21))  return { sign: 'Sagittarius', symbol: '♐', emoji: '🏹' };
    if ((month === 12 && day >= 22)||(month === 1  && day <= 19))  return { sign: 'Capricorn',   symbol: '♑', emoji: '🐐' };
    if ((month === 1  && day >= 20)||(month === 2  && day <= 18))  return { sign: 'Aquarius',    symbol: '♒', emoji: '🌊' };
    return { sign: 'Pisces', symbol: '♓', emoji: '🐟' };
  }

  getBabySeason(): { name: string; emoji: string } {
    if (!this.pregnancy?.dueDate) return { name: 'Unknown', emoji: '🌟' };
    const month = new Date(this.pregnancy.dueDate).getMonth() + 1;
    if (month >= 3 && month <= 5)  return { name: 'Spring', emoji: '🌸' };
    if (month >= 6 && month <= 8)  return { name: 'Summer', emoji: '☀️' };
    if (month >= 9 && month <= 11) return { name: 'Autumn', emoji: '🍂' };
    return { name: 'Winter', emoji: '❄️' };
  }

  getBirthDayOfWeek(): string {
    if (!this.pregnancy?.dueDate) return '';
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return days[new Date(this.pregnancy.dueDate).getDay()];
  }

  // ── Citation motivante ──────────────────────────────
  getMotivationalQuote(): string {
    if (this.isBirthDay)        return 'Today is the day, mama. You are ready!';
    if (this.isUrgent)          return 'Every breath brings you closer to your baby.';
    if (this.isSoon)            return "The best is yet to come. Your little one can't wait to meet you.";
    if (this.daysLeft < 60)     return 'You are doing an incredible job. Almost there, mama!';
    return 'Every day your baby grows a little more. You are amazing.';
  }

  // ── Checklist Get Ready ─────────────────────────────
  getChecklist(): { label: string; done: boolean }[] {
    const w = this.currentWeek;
    return [
      { label: 'Pack your hospital bag',   done: w >= 36 },
      { label: 'Install the car seat',     done: w >= 37 },
      { label: 'Prepare your birth plan',  done: w >= 35 },
      { label: 'Pre-register at hospital', done: w >= 34 },
      { label: 'Set up the nursery',       done: w >= 33 },
    ];
  }

  applyFilter(event: Event) {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }
}