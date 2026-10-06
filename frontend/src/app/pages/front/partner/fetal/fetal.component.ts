import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FetalMilestone } from '../../../../core/models/pregnancy.model';
import { PregnancyService } from '../../../../core/services/pregnancy.service';
import { FetalMilestoneService } from '../../../../core/services/fetal-milestone.service';

@Component({
  selector: 'app-partner-fetal',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './fetal.html',
  styleUrl: './fetal.scss'
})
export class PartnerFetalComponent implements OnInit {
  fetalInfo: FetalMilestone | null = null;
  currentWeek = 0;
  week = 1;
  loading = true;

  constructor(
    private pregnancyService: PregnancyService,
    private fetalService: FetalMilestoneService,
  ) {}

  ngOnInit() {
    this.pregnancyService.getActiveForPartner().subscribe({
      next: (p) => {
        const start = new Date(p.lmpDate);
        const diff = Math.floor((new Date().getTime() - start.getTime()) / (1000*60*60*24*7));
        this.currentWeek = Math.min(Math.max(diff, 0), 40);
        this.week = this.currentWeek || 1;
        this.loadFetal();
      },
      error: () => { this.loading = false; }
    });
  }

  loadFetal() {
    this.loading = true;
    this.fetalService.getByWeek(this.week).subscribe({
      next: (f) => { this.fetalInfo = f; this.loading = false; },
      error: () => { this.fetalInfo = null; this.loading = false; }
    });
  }

  previousWeek() { if (this.week > 1) { this.week--; this.loadFetal(); } }
  nextWeek() { if (this.week < 40) { this.week++; this.loadFetal(); } }
}