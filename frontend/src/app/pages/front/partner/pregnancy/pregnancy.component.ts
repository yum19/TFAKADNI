import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { PregnancyService } from '../../../../core/services/pregnancy.service';
import { Pregnancy } from '../../../../core/models/pregnancy.model';

@Component({
  selector: 'app-partner-pregnancy',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressBarModule, MatDividerModule],
  templateUrl: './pregnancy.html',
  styleUrl: './pregnancy.scss'
})
export class PartnerPregnancyComponent implements OnInit {
  pregnancy: Pregnancy | null = null;
  currentWeek = 0;
  loading = true;
  accessDenied = false;

  constructor(private pregnancyService: PregnancyService) {}

  ngOnInit() {
    this.pregnancyService.getActiveForPartner().subscribe({
      next: (p) => {
        this.pregnancy = p;
        const start = new Date(p.lmpDate);
        const diff = Math.floor((new Date().getTime() - start.getTime()) / (1000*60*60*24*7));
        this.currentWeek = Math.min(Math.max(diff, 0), 40);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 403) this.accessDenied = true;
      }
    });
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

  getTrimester(): string {
    if (this.currentWeek <= 12) return '1st Trimester';
    if (this.currentWeek <= 26) return '2nd Trimester';
    return '3rd Trimester';
  }
}