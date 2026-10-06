import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexResponsive,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  NgApexchartsModule
} from 'ng-apexcharts';


import {
  FollowUpAnalyticsResponse,
  RiskAppointmentStatusRow,
  ScreeningAppointmentOverview
} from '../../../core/services/module6b/follow-up-analytics.model';
import { FollowUpAnalyticsService } from '../../../core/services/module6b/follow-up-analytics.service';

export type BarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  colors: string[];
  legend?: ApexLegend;
  fill?: ApexFill;
  responsive?: ApexResponsive[];
};

export type DonutChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  legend: ApexLegend;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  colors: string[];
  responsive: ApexResponsive[];
  plotOptions: ApexPlotOptions;
};

export type RadialChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
  colors: string[];
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
};

interface MetricCard {
  label: string;
  value: string;
  helper: string;
  icon: string;
  tone: string;
}

@Component({
  selector: 'app-follow-up-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    NgApexchartsModule,
  ],
  templateUrl: './follow-up-analytics.component.html',
  styleUrls: ['./follow-up-analytics.component.css']
})
export class FollowUpAnalyticsComponent implements OnInit {
  private analyticsService = inject(FollowUpAnalyticsService);

  loading = true;
  error = '';
  exportingCsv = false;
  exportingPdf = false;
  analytics: FollowUpAnalyticsResponse | null = null;

  metrics: MetricCard[] = [];

  riskDistributionChart!: Partial<BarChartOptions>;
  followUpDonutChart!: Partial<DonutChartOptions>;
  appointmentStatusChart!: Partial<BarChartOptions>;
  followUpProgressChart!: Partial<RadialChartOptions>;
  coverageComparisonChart!: Partial<BarChartOptions>;

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.error = '';

    this.analyticsService.getAnalytics().subscribe({
      next: (response) => {
        this.analytics = response;
        this.buildMetrics(response.overview);
        this.buildCharts(response.overview, response.matrix);
        this.loading = false;
      },
      error: (err) => {
        console.error('Analytics loading error:', err);
        this.error = 'Unable to load follow-up analytics right now. Please try again.';
        this.loading = false;
      }
    });
  }

  private buildMetrics(overview: ScreeningAppointmentOverview): void {
    this.metrics = [
      {
        label: 'High risk cases',
        value: this.formatNumber(overview.highRiskCount),
        helper: `${overview.totalPredictions} total predictions analyzed`,
        icon: 'warning',
        tone: 'tone-red'
      },
      {
        label: 'With appointment',
        value: this.formatNumber(overview.highRiskWithAppointment),
        helper: 'High-risk mothers who booked a psych appointment',
        icon: 'event_available',
        tone: 'tone-blue'
      },
      {
        label: 'Without appointment',
        value: this.formatNumber(overview.highRiskWithoutAppointment),
        helper: 'High-risk mothers still without follow-up',
        icon: 'pending_actions',
        tone: 'tone-orange'
      },
      {
        label: 'Follow-up rate',
        value: `${this.formatDecimal(overview.highRiskFollowUpRate)}%`,
        helper: `Average delay: ${this.formatDecimal(overview.averageDelayDays)} days`,
        icon: 'monitoring',
        tone: 'tone-green'
      }
    ];
  }

  private buildCharts(
    overview: ScreeningAppointmentOverview,
    matrix: RiskAppointmentStatusRow[]
  ): void {
    this.riskDistributionChart = {
      series: [
        {
          name: 'Predictions',
          data: [
            overview.lowRiskCount,
            overview.moderateRiskCount,
            overview.highRiskCount
          ]
        }
      ],
      chart: {
        type: 'bar',
        height: 320,
        toolbar: { show: false },
        animations: { enabled: true, speed: 700 }
      },
      colors: ['#6d8dff', '#f7a62c', '#ef476f'],
      plotOptions: {
        bar: {
          borderRadius: 12,
          columnWidth: '45%',
          distributed: true
        }
      },
      dataLabels: {
        enabled: true,
        style: { fontWeight: '700' }
      },
      stroke: { show: false },
      xaxis: {
        categories: ['Low', 'Moderate', 'High'],
        labels: { style: { fontSize: '13px', fontWeight: 700 } }
      },
      yaxis: { labels: { style: { fontSize: '12px' } } },
      tooltip: { y: { formatter: (value: number) => `${value} prediction(s)` } }
    };

    this.followUpDonutChart = {
      series: [overview.highRiskWithAppointment, overview.highRiskWithoutAppointment],
      chart: { type: 'donut', height: 320 },
      labels: ['With appointment', 'Without appointment'],
      colors: ['#1dbf73', '#ef476f'],
      stroke: { width: 0 },
      legend: { position: 'bottom', fontSize: '13px' },
      dataLabels: { enabled: true },
      tooltip: { y: { formatter: (value: number) => `${value} mother(s)` } },
      plotOptions: { pie: { donut: { size: '68%' } } },
      responsive: [
        {
          breakpoint: 768,
          options: { chart: { height: 280 }, legend: { position: 'bottom' } }
        }
      ]
    };

    const high = matrix.find((row) => row.riskLevel.toUpperCase() === 'HIGH');
    const moderate = matrix.find((row) => row.riskLevel.toUpperCase() === 'MODERATE');
    const low = matrix.find((row) => row.riskLevel.toUpperCase() === 'LOW');

    this.appointmentStatusChart = {
      series: [
        { name: 'Planned', data: [low?.plannedCount ?? 0, moderate?.plannedCount ?? 0, high?.plannedCount ?? 0] },
        { name: 'Completed', data: [low?.completedCount ?? 0, moderate?.completedCount ?? 0, high?.completedCount ?? 0] },
        { name: 'Cancelled', data: [low?.cancelledCount ?? 0, moderate?.cancelledCount ?? 0, high?.cancelledCount ?? 0] }
      ],
      chart: { type: 'bar', height: 340, stacked: true, toolbar: { show: false }, animations: { enabled: true, speed: 700 } },
      colors: ['#6d8dff', '#1dbf73', '#f7a62c'],
      plotOptions: { bar: { borderRadius: 8, columnWidth: '48%' } },
      dataLabels: { enabled: false },
      stroke: { show: false },
      xaxis: { categories: ['Low', 'Moderate', 'High'], labels: { style: { fontSize: '13px', fontWeight: 700 } } },
      yaxis: { labels: { style: { fontSize: '12px' } } },
      tooltip: { shared: true, intersect: false },
      legend: { position: 'top' }
    };

    this.followUpProgressChart = {
      series: [Number(overview.highRiskFollowUpRate ?? 0)],
      chart: { type: 'radialBar', height: 310 },
      labels: ['Follow-up completion'],
      colors: ['#ff4f75'],
      stroke: { lineCap: 'round' },
      dataLabels: { enabled: true },
      plotOptions: {
        radialBar: {
          hollow: { size: '62%' },
          track: { background: '#f6dfe6' },
          dataLabels: {
            name: { fontSize: '14px', fontWeight: 700, offsetY: 18 },
            value: { fontSize: '28px', fontWeight: 800, offsetY: -18, formatter: (val: number) => `${Number(val).toFixed(1)}%` }
          }
        }
      }
    };

    this.coverageComparisonChart = {
      series: [
        { name: 'Linked appointments', data: [low?.linkedAppointments ?? 0, moderate?.linkedAppointments ?? 0, high?.linkedAppointments ?? 0] },
        { name: 'No appointment', data: [low?.noAppointment ?? 0, moderate?.noAppointment ?? 0, high?.noAppointment ?? 0] }
      ],
      chart: { type: 'bar', height: 320, toolbar: { show: false }, animations: { enabled: true, speed: 700 } },
      colors: ['#1dbf73', '#ef476f'],
      plotOptions: { bar: { horizontal: true, borderRadius: 10, barHeight: '48%' } },
      dataLabels: { enabled: false },
      stroke: { show: false },
      xaxis: { categories: ['Low', 'Moderate', 'High'] },
      yaxis: { labels: { style: { fontWeight: 700 } } },
      tooltip: { shared: true, intersect: false },
      legend: { position: 'top' }
    };
  }

  // ─────────────────────────────────────────────
  // EXPORT CSV  – properly encoded, well structured
  // ─────────────────────────────────────────────
  exportCsv(): void {
    if (!this.overview || this.exportingCsv) return;
    this.exportingCsv = true;

    const lines: string[] = [];
    const sep = ',';
    const stamp = this.getDateStamp();

    // ── Section 1: document header ─────────────
    lines.push(`Follow-up Analytics Report`);
    lines.push(`Generated on${sep}${stamp}`);
    lines.push('');

    // ── Section 2: overview KPIs ───────────────
    lines.push('=== OVERVIEW ===');
    lines.push(`Metric${sep}Value`);
    lines.push(`Total predictions${sep}${this.overview.totalPredictions}`);
    lines.push(`Low risk count${sep}${this.overview.lowRiskCount}`);
    lines.push(`Moderate risk count${sep}${this.overview.moderateRiskCount}`);
    lines.push(`High risk count${sep}${this.overview.highRiskCount}`);
    lines.push(`High risk – with appointment${sep}${this.overview.highRiskWithAppointment}`);
    lines.push(`High risk – without appointment${sep}${this.overview.highRiskWithoutAppointment}`);
    lines.push(`High risk follow-up rate (%)${sep}${this.formatDecimal(this.overview.highRiskFollowUpRate)}`);
    lines.push(`Average delay (days)${sep}${this.formatDecimal(this.overview.averageDelayDays)}`);
    lines.push(`Planned linked appointments${sep}${this.overview.plannedAppointmentsLinkedToPrediction}`);
    lines.push(`Completed linked appointments${sep}${this.overview.completedAppointmentsLinkedToPrediction}`);
    lines.push(`Cancelled linked appointments${sep}${this.overview.cancelledAppointmentsLinkedToPrediction}`);
    lines.push('');

    // ── Section 3: priority insight ───────────
    lines.push('=== PRIORITY INSIGHT ===');
    lines.push(`Priority note${sep}${this.escapeCsvValue(this.priorityMessage)}`);
    lines.push(`Performance insight${sep}${this.escapeCsvValue(this.strongestInsight)}`);
    lines.push('');

    // ── Section 4: risk / appointment matrix ──
    lines.push('=== RISK / APPOINTMENT MATRIX ===');
    lines.push([
      'Risk Level',
      'Total Predictions',
      'Linked Appointments',
      'No Appointment',
      'Planned',
      'Completed',
      'Cancelled'
    ].join(sep));

    for (const row of this.matrix) {
      lines.push([
        this.escapeCsvValue(row.riskLevel),
        row.totalPredictions,
        row.linkedAppointments,
        row.noAppointment,
        row.plannedCount,
        row.completedCount,
        row.cancelledCount
      ].join(sep));
    }

    // ── Build blob with UTF-8 BOM (Excel compat) ──
    const csvContent = lines.join('\r\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `follow-up-analytics-${stamp}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.exportingCsv = false;
  }

  // ─────────────────────────────────────────────
  // EXPORT PDF  – programmatic, well-designed layout
  // Uses jsPDF + html2canvas (add to package.json:
  //   "jspdf": "^2.5.1", "html2canvas": "^1.4.1")
  // ─────────────────────────────────────────────
  async exportPdf(): Promise<void> {
    if (!this.overview || this.exportingPdf) return;
    this.exportingPdf = true;

    try {
    // Dynamic import so bundle is not bloated for users who never export
    const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);

    const stamp = this.getDateStamp();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    const colW = (pageW - margin * 2 - 8) / 2;
    let y = margin;

    // ── Helpers ───────────────────────────────
    const addPage = () => {
      doc.addPage();
      y = margin;
      this.pdfDrawHeader(doc, pageW, stamp);
      y = 24;
    };

    const ensureSpace = (needed: number) => {
      if (y + needed > pageH - 14) addPage();
    };

    const sectionTitle = (text: string) => {
      ensureSpace(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(69, 40, 58);
      doc.text(text, margin, y);
      y += 2;
      doc.setDrawColor(255, 79, 117);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
    };

    const kpiRow = (label: string, value: string, x: number, boxY: number, w: number) => {
      doc.setFillColor(255, 249, 251);
      doc.setDrawColor(255, 79, 117, 0.12);
      doc.roundedRect(x, boxY, w, 18, 4, 4, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(127, 102, 115);
      doc.text(label, x + 4, boxY + 6.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(69, 40, 58);
      doc.text(value, x + 4, boxY + 14);
    };

    // ── Page 1 header ─────────────────────────
    // Top gradient band
    doc.setFillColor(255, 79, 117);
    doc.rect(0, 0, pageW, 36, 'F');

    doc.setFillColor(109, 141, 255);
    doc.rect(pageW - 50, 0, 50, 36, 'F');

    doc.setFillColor(255, 79, 117);
    doc.circle(pageW - 50, 18, 18, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('Follow-up Analytics', margin, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 220, 230);
    doc.text('Postpartum screening · Psychological follow-up dashboard', margin, 23);
    doc.text(`Generated: ${stamp}`, margin, 30);

    y = 44;

    // ── KPI grid (4 cards, 2×2) ───────────────
    sectionTitle('KEY PERFORMANCE INDICATORS');

    const kpis = [
      { label: 'High Risk Cases', value: String(this.overview.highRiskCount) },
      { label: 'With Appointment', value: String(this.overview.highRiskWithAppointment) },
      { label: 'Without Appointment', value: String(this.overview.highRiskWithoutAppointment) },
      { label: 'Follow-up Rate', value: `${this.formatDecimal(this.overview.highRiskFollowUpRate)}%` }
    ];

    const kpiH = 22;
    kpis.forEach((kpi, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const kx = margin + col * (colW + 8);
      const ky = y + row * (kpiH + 4);
      kpiRow(kpi.label, kpi.value, kx, ky, colW);
    });

    y += 2 * (kpiH + 4) + 10;

    // ── Overview table ────────────────────────
    sectionTitle('ANALYTICS OVERVIEW');

    const overviewRows = [
      ['Total predictions', String(this.overview.totalPredictions)],
      ['Low risk count', String(this.overview.lowRiskCount)],
      ['Moderate risk count', String(this.overview.moderateRiskCount)],
      ['High risk count', String(this.overview.highRiskCount)],
      ['Average delay (days)', this.formatDecimal(this.overview.averageDelayDays)],
      ['Planned linked appointments', String(this.overview.plannedAppointmentsLinkedToPrediction)],
      ['Completed linked appointments', String(this.overview.completedAppointmentsLinkedToPrediction)],
      ['Cancelled linked appointments', String(this.overview.cancelledAppointmentsLinkedToPrediction)],
    ];

    this.pdfDrawTable(doc, overviewRows, ['Metric', 'Value'], [130, 46], margin, y, pageW);
    y += overviewRows.length * 9 + 18;

    // ── Insights ──────────────────────────────
    ensureSpace(30);
    sectionTitle('EXECUTIVE INSIGHTS');

    const drawInsight = (icon: string, title: string, text: string) => {
      ensureSpace(24);
      doc.setFillColor(255, 249, 251);
      doc.setDrawColor(109, 141, 255);
      doc.roundedRect(margin, y, pageW - margin * 2, 20, 4, 4, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(69, 40, 58);
      doc.text(`${icon}  ${title}`, margin + 4, y + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(127, 102, 115);
      const lines = doc.splitTextToSize(text, pageW - margin * 2 - 8);
      doc.text(lines, margin + 4, y + 14);

      y += 24;
    };

    drawInsight('⚠', 'Priority Case Note', this.priorityMessage);
    drawInsight('📈', 'Performance Insight', this.strongestInsight);

    y += 6;

    // ── Risk / Appointment Matrix ─────────────
    ensureSpace(50);
    sectionTitle('RISK / APPOINTMENT MATRIX');

    const matrixHeaders = ['Risk Level', 'Total', 'Linked Appts', 'No Appt', 'Planned', 'Completed', 'Cancelled'];
    const matrixColW = [28, 18, 28, 18, 20, 24, 22];
    const matrixRows = this.matrix.map(row => [
      row.riskLevel,
      String(row.totalPredictions),
      String(row.linkedAppointments),
      String(row.noAppointment),
      String(row.plannedCount),
      String(row.completedCount),
      String(row.cancelledCount)
    ]);

    this.pdfDrawMatrixTable(doc, matrixRows, matrixHeaders, matrixColW, margin, y);
    y += matrixRows.length * 10 + 20;

    // ── Charts screenshot (optional, best-effort) ──
    const chartEl = document.querySelector('apx-chart') as HTMLElement | null;
    if (chartEl) {
      try {
        ensureSpace(80);
        sectionTitle('CHARTS OVERVIEW');
        const canvas = await html2canvas(chartEl, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const ratio = canvas.width / canvas.height;
        const imgW = pageW - margin * 2;
        const imgH = imgW / ratio;
        ensureSpace(imgH + 6);
        doc.addImage(imgData, 'PNG', margin, y, imgW, imgH);
        y += imgH + 6;
      } catch (_) {
        // silently skip if canvas capture fails
      }
    }

    // ── Footer on every page ──────────────────
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFillColor(250, 245, 248);
      doc.rect(0, pageH - 12, pageW, 12, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(165, 141, 153);
      doc.text('Follow-up Analytics · Confidential medical report', margin, pageH - 4.5);
      doc.text(`Page ${p} / ${totalPages}`, pageW - margin, pageH - 4.5, { align: 'right' });
    }

    doc.save(`follow-up-analytics-${stamp}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      this.exportingPdf = false;
    }
  }

  // ── PDF helpers ───────────────────────────────
  private pdfDrawHeader(doc: any, pageW: number, stamp: string): void {
    doc.setFillColor(255, 79, 117);
    doc.rect(0, 0, pageW, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('Follow-up Analytics (continued)', 14, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 220, 230);
    doc.text(stamp, pageW - 14, 12, { align: 'right' });
  }

  private pdfDrawTable(
    doc: any,
    rows: string[][],
    headers: string[],
    colWidths: number[],
    x: number,
    startY: number,
    pageW: number
  ): void {
    const rowH = 9;

    // Header
    doc.setFillColor(255, 79, 117);
    doc.rect(x, startY, colWidths[0] + colWidths[1], rowH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    headers.forEach((h, i) => {
      const cx = x + (i === 0 ? 0 : colWidths[0] + 2);
      doc.text(h, cx + 3, startY + 6.2);
    });

    // Rows
    rows.forEach((row, ri) => {
      const ry = startY + (ri + 1) * rowH;
      doc.setFillColor(ri % 2 === 0 ? 255 : 250, ri % 2 === 0 ? 249 : 247, ri % 2 === 0 ? 251 : 249);
      doc.rect(x, ry, colWidths[0] + colWidths[1], rowH, 'F');
      doc.setFont('helvetica', ri === 0 ? 'bold' : 'normal');
      doc.setFontSize(8.5);

      row.forEach((cell, ci) => {
        const cx = x + (ci === 0 ? 0 : colWidths[0] + 2);
        const align = ci === 1 ? 'right' : 'left';
        const tx = ci === 1 ? cx + colWidths[1] - 3 : cx + 3;
        doc.setTextColor(ci === 0 ? 69 : 127, ci === 0 ? 40 : 102, ci === 0 ? 58 : 115);
        doc.text(cell, tx, ry + 6.2, { align });
      });
    });
  }

  private pdfDrawMatrixTable(
    doc: any,
    rows: string[][],
    headers: string[],
    colWidths: number[],
    x: number,
    startY: number
  ): void {
    const rowH = 10;
    const totalW = colWidths.reduce((a, b) => a + b, 0);

    // Header row
    doc.setFillColor(255, 79, 117);
    doc.rect(x, startY, totalW, rowH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);

    let cx = x;
    headers.forEach((h, i) => {
      doc.text(h, cx + 3, startY + 7);
      cx += colWidths[i];
    });

    // Data rows
    rows.forEach((row, ri) => {
      const ry = startY + (ri + 1) * rowH;
      const isEven = ri % 2 === 0;
      doc.setFillColor(isEven ? 255 : 250, isEven ? 249 : 247, isEven ? 251 : 249);
      doc.rect(x, ry, totalW, rowH, 'F');

      let dx = x;
      row.forEach((cell, ci) => {
        doc.setFont('helvetica', ci === 0 ? 'bold' : 'normal');
        doc.setFontSize(8);

        // Colour-code risk level
        if (ci === 0) {
          const upper = cell.toUpperCase();
          if (upper === 'HIGH') doc.setTextColor(215, 60, 102);
          else if (upper === 'MODERATE') doc.setTextColor(186, 109, 11);
          else doc.setTextColor(23, 152, 92);
        } else {
          doc.setTextColor(69, 40, 58);
        }

        doc.text(cell, dx + 3, ry + 7);
        dx += colWidths[ci];
      });

      // Row bottom line
      doc.setDrawColor(255, 79, 117);
      doc.setLineWidth(0.15);
      doc.line(x, ry + rowH, x + totalW, ry + rowH);
    });

    // Outer border
    doc.setDrawColor(255, 79, 117);
    doc.setLineWidth(0.4);
    doc.rect(x, startY, totalW, (rows.length + 1) * rowH);
  }

  // ── Generic utils ─────────────────────────────
  exportCsvIcon = 'table_view';
  exportPdfIcon = 'picture_as_pdf';

  get matrix(): RiskAppointmentStatusRow[] {
    return this.analytics?.matrix ?? [];
  }

  get overview(): ScreeningAppointmentOverview | null {
    return this.analytics?.overview ?? null;
  }

  get priorityMessage(): string {
    if (!this.overview) return 'Analytics summary unavailable.';
    if (this.overview.highRiskWithoutAppointment > 0) {
      return `${this.overview.highRiskWithoutAppointment} high-risk case(s) still have no psychological appointment and may need immediate follow-up.`;
    }
    return 'All high-risk cases currently have a linked follow-up appointment.';
  }

  get strongestInsight(): string {
    if (!this.overview) return '';
    return `The current high-risk follow-up rate is ${this.formatDecimal(this.overview.highRiskFollowUpRate)}%, with an average delay of ${this.formatDecimal(this.overview.averageDelayDays)} days between prediction and appointment booking.`;
  }

  getToneClass(riskLevel: string): string {
    const value = riskLevel.toUpperCase();
    if (value === 'HIGH') return 'risk-high';
    if (value === 'MODERATE') return 'risk-mid';
    return 'risk-low';
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value ?? 0);
  }

  formatDecimal(value: number): string {
    return Number(value ?? 0).toFixed(1);
  }

  private escapeCsvValue(value: string | number | null | undefined): string {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private getDateStamp(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}