import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Alert } from '../../../core/models/pregnancy.model';
import { AlertsService } from '../../../core/services/alerts.service';

@Component({
  selector: 'app-alerts-admin',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatDividerModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, FormsModule,
  ],
  templateUrl: './alerts-admin.html',
  styleUrl: './alerts-admin.scss'
})
export class AlertsAdminComponent implements OnInit {

  allAlerts: Alert[] = [];
  filteredAlerts: Alert[] = [];
  loading = true;

  totalAlerts   = 0;
  totalCritical = 0;
  totalDanger   = 0;
  totalUnread   = 0;

  filterStatus   = 'ALL';
  filterSeverity = 'ALL';
  filterPatient  = '';   

  constructor(private alertsService: AlertsService) {}

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading = true;
    this.alertsService.getAllAlertsAdmin().subscribe({
      next: (list) => {
        this.allAlerts = list.sort((a, b) =>
          new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
        );
        this.totalAlerts   = list.length;
        this.totalCritical = list.filter(a => a.severity === 'CRITICAL').length;
        this.totalDanger   = list.filter(a => a.severity === 'DANGER').length;
        this.totalUnread   = list.filter(a => !a.isRead).length;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => { 
        console.error('Failed to load alerts:', err);
        this.loading = false; 
      }
    });
  }

  applyFilters() {
    this.filteredAlerts = this.allAlerts.filter(a => {
      const matchSeverity = this.filterSeverity === 'ALL' || a.severity === this.filterSeverity;
      const matchStatus   = this.filterStatus === 'ALL'
        || (this.filterStatus === 'UNREAD' && !a.isRead)
        || (this.filterStatus === 'READ'   &&  a.isRead);
      const matchPatient  = !this.filterPatient.trim()
        || this.getPatientName(a).toLowerCase().includes(this.filterPatient.toLowerCase());
      return matchSeverity && matchStatus && matchPatient;
    });
  }

  getPatientName(alert: Alert): string {
    if (alert.user) {
      if (alert.user.firstName || alert.user.lastName) {
        return `${alert.user.firstName || ''} ${alert.user.lastName || ''}`.trim();
      }
      if (alert.user.email) return alert.user.email;
    }
    return 'Patient';
  }

  getPatientInitials(alert: Alert): string {
    const user = alert.user;
    if (!user) return '?';
    
    if (user.firstName && user.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    if (user.firstName) return user.firstName.substring(0, 2).toUpperCase();
    if (user.email) return user.email.substring(0, 2).toUpperCase();
    
    return '?';
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
}