import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Alert } from '../../../../core/models/pregnancy.model';
import { AlertsService } from '../../../../core/services/alerts.service';
import { AlertBadgeService } from '../../../../core/services/alert-badge.service';

@Component({
  selector: 'app-femme-alerts',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatDividerModule, MatChipsModule,
  ],
  templateUrl: './alerts.html',
  styleUrl: './alerts.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AlertsComponent implements OnInit {

  alerts: Alert[] = [];
  loading = true;
  totalUnread = 0;
  totalCritical = 0;

  constructor(
    private alertsService: AlertsService,
    private alertBadge: AlertBadgeService   // ← injecté
  ) {}

  ngOnInit() { this.loadAlerts(); }

  loadAlerts() {
    this.loading = true;
    this.alertsService.getMyAlerts().subscribe({
      next: (list) => {
        this.alerts = list.sort((a, b) =>
          new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
        );
        this.totalUnread   = list.filter(a => !a.isRead).length;
        this.totalCritical = list.filter(a => a.severity === 'CRITICAL').length;

        // ← Synchroniser le badge de la navbar
        this.alertBadge.set(this.totalUnread);

        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  markAsRead(alert: Alert) {
    if (alert.isRead) return;
    this.alertsService.markAsRead(alert.id).subscribe({
      next: (updated) => {
        const idx = this.alerts.findIndex(a => a.id === alert.id);
        if (idx !== -1) {
          this.alerts[idx] = updated;
          this.totalUnread = this.alerts.filter(a => !a.isRead).length;

          // ← Décrémenter le badge immédiatement sans reload
          this.alertBadge.decrement();
        }
      }
    });
  }

  markAllAsRead() {
    this.alertsService.markAllAsRead().subscribe({
      next: () => {
        // ← Badge à 0 immédiatement
        this.alertBadge.reset();
        this.loadAlerts();
      }
    });
  }

  dismissAlert(alert: Alert) {
    this.alertsService.dismiss(alert.id).subscribe({
      next: () => { this.loadAlerts(); }
    });
  }

  getSeverityColor(s: string): string {
    const m: any = { INFO: '#03a9f4', WARNING: '#ff9800', DANGER: '#f44336', CRITICAL: '#9c27b0' };
    return m[s] || '#999';
  }

  getSeverityIcon(s: string): string {
    const m: any = { INFO: 'info', WARNING: 'warning', DANGER: 'error', CRITICAL: 'crisis_alert' };
    return m[s] || 'notifications';
  }

  getTypeLabel(t: string): string {
    const m: any = {
      HYPERTENSION: 'Hypertension', HYPOGLYCEMIA: 'Hypoglycemia',
      WEIGHT: 'Weight', TACHYCARDIA: 'Tachycardia',
      FEVER: 'Fever', OXYGEN: 'Oxygen', CUSTOM: 'Custom'
    };
    return m[t] || t;
  }

  countBySeverity(severity: string): number {
    return this.alerts.filter(a => a.severity === severity).length;
  }
}