import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Report {
  key: string;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
  bgColor: string;
  excelUrl: string;
  pdfUrl: string;
  downloading: { excel: boolean; pdf: boolean };
  stats: { label: string; value: string }[];
}

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatDividerModule, MatTooltipModule],
  styles: [`

    :host {
      --rose: #e8436c;
      --ink: #1a1028;
      --ink-soft: #3d2f4a;
      --muted: #8b7d98;
      --border: #ede8f2;
      --surface: #faf8fc;
      --white: #fff;
      --shadow-sm: 0 2px 8px rgba(26,16,40,.06);
      --shadow-md: 0 8px 32px rgba(26,16,40,.10);
      --shadow-lg: 0 20px 60px rgba(26,16,40,.14);
      display: block;
      
      min-height: 100vh;
    }

    .reports-page { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem; }

    /* ── Header ── */
    .page-eyebrow {
       font-size: 11px; font-weight: 700;
      letter-spacing: .18em; text-transform: uppercase; color: var(--rose); margin-bottom: .4rem;
    }
    .page-title {  font-size: 2.2rem; font-weight: 800; color: var(--ink); margin: 0 0 .35rem; }
    .page-sub { font-size: 14px; color: var(--muted); margin: 0 0 2.5rem; font-weight: 300; }

    /* ── Activity Banner ── */
    .activity-banner {
      background: linear-gradient(135deg, var(--ink) 0%, #3d2f4a 60%, #5c3d7a 100%);
      border-radius: 24px;
      padding: 2rem 2.5rem;
      margin-bottom: 2.5rem;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 2rem;
      align-items: center;
      position: relative;
      overflow: hidden;
    }
    .activity-banner::before {
      content: '';
      position: absolute;
      top: -60px; right: -60px;
      width: 200px; height: 200px;
      border-radius: 50%;
      background: rgba(232,67,108,.2);
    }
    .activity-banner::after {
      content: '';
      position: absolute;
      bottom: -40px; right: 120px;
      width: 130px; height: 130px;
      border-radius: 50%;
      background: rgba(232,67,108,.12);
    }
    .banner-label { font-size: 12px; color: rgba(255,255,255,.6); text-transform: uppercase; letter-spacing: .1em; margin-bottom: .5rem; }
    .banner-title {  font-size: 1.3rem; font-weight: 700; color: #fff; margin-bottom: 1rem; }
    .banner-stats { display: flex; gap: 2.5rem; }
    .banner-stat-val {  font-size: 1.8rem; font-weight: 800; color: #fff; line-height: 1; }
    .banner-stat-lbl { font-size: 12px; color: rgba(255,255,255,.55); margin-top: .2rem; }
    .banner-export-all {
       font-weight: 700 !important;
      background: rgba(255,255,255,.15) !important; color: #fff !important;
      border: 1.5px solid rgba(255,255,255,.3) !important;
      border-radius: 12px !important; height: 46px !important; padding: 0 1.5rem !important;
      display: flex !important; align-items: center !important; gap: .4rem !important;
      backdrop-filter: blur(8px) !important;
      transition: background .2s !important; position: relative; z-index: 1;
    }
    .banner-export-all:hover { background: rgba(255,255,255,.25) !important; }

    /* ── Report Cards Grid ── */
    .reports-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 2rem; }
    @media (max-width: 900px) { .reports-grid { grid-template-columns: 1fr; } }
    @media (max-width: 1100px) { .reports-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); } }

    .report-card {
      background: var(--white);
      border-radius: 20px;
      border: 1.5px solid var(--border);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
      transition: box-shadow .25s, transform .25s;
    }
    .report-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); }

    .rc-top {
      padding: 1.5rem 1.5rem 1.25rem;
      position: relative;
    }
    .rc-accent-bar {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
    }
    .rc-icon-wrap {
      width: 52px; height: 52px; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 1rem;
    }
    .rc-icon-wrap mat-icon { font-size: 26px; width: 26px; height: 26px; }
    .rc-title {  font-size: 1.1rem; font-weight: 700; color: var(--ink); margin-bottom: .25rem; }
    .rc-desc { font-size: 13px; color: var(--muted); font-weight: 300; line-height: 1.5; }

    /* Mini stats inside card */
    .rc-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: .75rem; padding: 0 1.5rem 1.25rem; }
    .rc-stat { background: var(--surface); border-radius: 10px; padding: .625rem .875rem; }
    .rc-stat-val {  font-size: 1.1rem; font-weight: 700; color: var(--ink); }
    .rc-stat-lbl { font-size: 11px; color: var(--muted); }

    /* Export buttons */
    .rc-actions {
      padding: 1rem 1.5rem 1.5rem;
      display: grid; grid-template-columns: 1fr 1fr; gap: .625rem;
      border-top: 1px solid var(--border);
    }
    .btn-excel {
       font-weight: 600 !important; font-size: 13px !important;
      border: 1.5px solid var(--border) !important; border-radius: 10px !important;
      color: var(--ink-soft) !important; height: 40px !important;
      display: flex !important; align-items: center !important; justify-content: center !important; gap: .35rem !important;
      transition: all .2s !important;
    }
    .btn-excel:hover { border-color: #16a34a !important; color: #16a34a !important; background: #f0fdf4 !important; }
    .btn-pdf {
       font-weight: 600 !important; font-size: 13px !important;
      border-radius: 10px !important; height: 40px !important;
      display: flex !important; align-items: center !important; justify-content: center !important; gap: .35rem !important;
      transition: all .2s !important;
    }

    /* ── Tips Block ── */
    .tips-block {
      background: var(--white); border-radius: 16px; border: 1px solid var(--border);
      padding: 1.25rem 1.5rem; display: flex; align-items: flex-start; gap: 1rem;
    }
    .tips-icon { flex-shrink: 0; width: 38px; height: 38px; border-radius: 10px; background: #fdf0f3; display: flex; align-items: center; justify-content: center; }
    .tips-icon mat-icon { color: var(--rose); font-size: 20px; width: 20px; height: 20px; }
    .tips-title {  font-size: .9rem; font-weight: 700; color: var(--ink); margin-bottom: .3rem; }
    .tips-text { font-size: 13px; color: var(--muted); line-height: 1.6; margin: 0; }

    /* Loading spinner inside btn */
    .spin-sm { display: inline-block; width: 16px; height: 16px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
  template: `
    <div class="reports-page">

      <!-- Header -->
      <div class="page-eyebrow">Analytique</div>
      <h1 class="page-title">Rapports & Exports</h1>
      <p class="page-sub">Générez et téléchargez vos rapports de données en temps réel</p>

      <!-- Activity Banner -->
      <div class="activity-banner">
        <div>
          <div class="banner-label">Vue d'ensemble — Données en temps réel</div>
          <div class="banner-title">Tableau de bord des exports</div>
          <div class="banner-stats">
            <div>
              <div class="banner-stat-val">1,248</div>
              <div class="banner-stat-lbl">Utilisateurs inscrits</div>
            </div>
            <div>
              <div class="banner-stat-val">36</div>
              <div class="banner-stat-lbl">Codes promo</div>
            </div>
            <div>
              <div class="banner-stat-val">18.4k</div>
              <div class="banner-stat-lbl">TND MRR</div>
            </div>
            <div>
              <div class="banner-stat-val">94%</div>
              <div class="banner-stat-lbl">Taux rétention</div>
            </div>
          </div>
        </div>
        <button mat-flat-button class="banner-export-all">
          <mat-icon>download</mat-icon>
          Tout exporter
        </button>
      </div>

      <!-- Report Cards -->
      <div class="reports-grid">
        @for (report of reports; track report.key) {
          <div class="report-card">
            <div class="rc-top">
              <div class="rc-accent-bar" [style.background]="report.accentColor"></div>
              <div class="rc-icon-wrap" [style.background]="report.bgColor">
                <mat-icon [style.color]="report.accentColor">{{ report.icon }}</mat-icon>
              </div>
              <div class="rc-title">{{ report.title }}</div>
              <div class="rc-desc">{{ report.description }}</div>
            </div>

            <div class="rc-stats">
              @for (stat of report.stats; track stat.label) {
                <div class="rc-stat">
                  <div class="rc-stat-val">{{ stat.value }}</div>
                  <div class="rc-stat-lbl">{{ stat.label }}</div>
                </div>
              }
            </div>

            <div class="rc-actions">
              <button mat-flat-button class="btn-excel"
                [disabled]="report.downloading.excel"
                (click)="download(report, 'excel')">
                @if (report.downloading.excel) { <span class="spin-sm"></span> }
                @else { <mat-icon style="font-size:16px;width:16px;height:16px">table_chart</mat-icon> }
                Excel
              </button>
              <button mat-flat-button class="btn-pdf"
                [style.background]="report.accentColor"
                [style.color]="'#fff'"
                [style.boxShadow]="'0 4px 14px ' + report.accentColor + '50'"
                [disabled]="report.downloading.pdf"
                (click)="download(report, 'pdf')">
                @if (report.downloading.pdf) { <span class="spin-sm"></span> }
                @else { <mat-icon style="font-size:16px;width:16px;height:16px">picture_as_pdf</mat-icon> }
                PDF
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Tips -->
      <div class="tips-block">
        <div class="tips-icon"><mat-icon>info</mat-icon></div>
        <div>
          <div class="tips-title">Données en temps réel</div>
          <p class="tips-text">
            Tous les rapports reflètent les données actuelles de la base de données au moment du téléchargement.
            Les fichiers Excel incluent des graphiques intégrés. Les fichiers PDF sont mis en page pour l'impression A4.
            Les rapports de revenus utilisent la configuration tarifaire des plans définie dans la section Plans.
          </p>
        </div>
      </div>

    </div>
  `,
})
export class AdminReportsComponent {
  reports: Report[] = [
    {
      key: 'users',
      title: 'Utilisateurs',
      description: 'Liste complète des comptes inscrits avec statuts, plans et activité',
      icon: 'group',
      accentColor: '#e8436c',
      bgColor: '#fdf0f3',
      excelUrl: `${environment.apiUrl}/reports/users/excel`,
      pdfUrl: `${environment.apiUrl}/reports/users/pdf`,
      downloading: { excel: false, pdf: false },
      stats: [
        { label: 'Total inscrits', value: '1,248' },
        { label: 'Actifs ce mois', value: '342' },
        { label: 'Nouveaux (7j)', value: '+28' },
        { label: 'Premium', value: '186' },
      ],
    },
    {
      key: 'promos',
      title: 'Codes Promo',
      description: 'Tous les codes promotionnels, taux d\'utilisation et statistiques de conversion',
      icon: 'local_offer',
      accentColor: '#7c3aed',
      bgColor: '#f5f3ff',
      excelUrl: `${environment.apiUrl}/reports/promos/excel`,
      pdfUrl: `${environment.apiUrl}/reports/promos/pdf`,
      downloading: { excel: false, pdf: false },
      stats: [
        { label: 'Total codes', value: '36' },
        { label: 'Actifs', value: '24' },
        { label: 'Utilisations', value: '892' },
        { label: 'Réduction moy.', value: '18%' },
      ],
    },
    {
      key: 'revenue',
      title: 'Revenus',
      description: 'Rapport détaillé des abonnements, MRR, ARR et tendances mensuelles',
      icon: 'payments',
      accentColor: '#16a34a',
      bgColor: '#f0fdf4',
      excelUrl: `${environment.apiUrl}/reports/revenue/excel`,
      pdfUrl: `${environment.apiUrl}/reports/revenue/pdf`,
      downloading: { excel: false, pdf: false },
      stats: [
        { label: 'MRR', value: '18.4k' },
        { label: 'ARR estimé', value: '220k' },
        { label: 'Croissance', value: '+12%' },
        { label: 'Churn rate', value: '3.2%' },
      ],
    },
  ];

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  download(report: Report, type: 'excel' | 'pdf'): void {
    const url = type === 'excel' ? report.excelUrl : report.pdfUrl;
    const ext = type === 'excel' ? 'xlsx' : 'pdf';
    const filename = `${report.key}-${new Date().toISOString().slice(0, 10)}.${ext}`;
    report.downloading[type] = true;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
        report.downloading[type] = false;
        this.snackBar.open(`${report.title} exporté en ${type.toUpperCase()} ✓`, 'OK', { duration: 3000 });
      },
      error: () => {
        report.downloading[type] = false;
        this.snackBar.open('Erreur lors de l\'export.', 'Fermer', { duration: 3000 });
      },
    });
  }
}