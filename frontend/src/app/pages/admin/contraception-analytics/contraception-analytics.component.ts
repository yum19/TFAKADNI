import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
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

import { PageRightComponent } from '../../../components/page-right/pageright.component';

// ── On importe le SERVICE (qui contient le token) ──
import {
  ContraceptionAnalyticsOverview,
  ContraceptionAnalyticsResponse,
  ContraceptionBreastfeedingStats,
  ContraceptionMethodStatusItem,
  ContraceptionPreferenceItem,
  ContraceptionWeeklyTrendItem
} from '../../../core/services/module6b/contraception-analytics.model';
import { ContraceptionAnalyticsService } from '../../../core/services/module6b/contraception-analytics.service';

type BarChartOptions = {
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

type DonutChartOptions = {
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

interface MetricCard {
  label: string;
  value: string;
  helper: string;
  icon: string;
  tone: string;
}

@Component({
  selector: 'app-contraception-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    NgApexchartsModule
  ],
  templateUrl: './contraception-analytics.component.html',
  styleUrls: ['./contraception-analytics.component.css']
})
export class ContraceptionAnalyticsComponent implements OnInit {

  // ✅ On utilise le SERVICE (qui envoie le Bearer token)
  private analyticsService = inject(ContraceptionAnalyticsService);

  loading = true;
  error = '';
  exportingCsv = false;
  exportingPdf = false;
  analytics: ContraceptionAnalyticsResponse | null = null;

  metrics: MetricCard[] = [];

  breastfeedingDonutChart!: Partial<DonutChartOptions>;
  preferencesBarChart!: Partial<BarChartOptions>;
  methodStatusChart!: Partial<BarChartOptions>;
  weeklyTrendChart!: Partial<BarChartOptions>;
  conversionGaugeChart!: Partial<DonutChartOptions>;

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.error = '';

    // ✅ analyticsService.getAnalytics() envoie bien le token Authorization
    this.analyticsService.getAnalytics().subscribe({
      next: (response) => {
        this.analytics = response;
        this.buildMetrics(response.overview);
        this.buildCharts(response);
        this.loading = false;
      },
      error: (err) => {
        console.error('Contraception analytics error:', err);
        this.error = 'Unable to load contraception analytics right now. Please try again.';
        this.loading = false;
      }
    });
  }

  private buildMetrics(overview: ContraceptionAnalyticsOverview): void {
    this.metrics = [
      {
        label: 'Recommendations',
        value: this.formatNumber(overview.totalRecommendations),
        helper: `Top preference: ${overview.topRecommendedPreference || 'N/A'}`,
        icon: 'psychology',
        tone: 'tone-blue'
      },
      {
        label: 'Active methods',
        value: this.formatNumber(overview.activeMethodsCount),
        helper: `Top active method: ${overview.topActiveMethod || 'N/A'}`,
        icon: 'health_and_safety',
        tone: 'tone-green'
      },
      {
        label: 'Chat messages',
        value: this.formatNumber(overview.totalChatMessages),
        helper: `${overview.totalChatSessions} active session(s)`,
        icon: 'chat',
        tone: 'tone-orange'
      },
      {
        label: 'Conversion rate',
        value: `${this.formatDecimal(overview.recommendationConversionRate)}%`,
        helper: 'Recommendation to active method adoption',
        icon: 'donut_large',
        tone: 'tone-red'
      }
    ];
  }

  private buildCharts(response: ContraceptionAnalyticsResponse): void {
    const { breastfeedingStats, topPreferences, methodStatusMatrix, weeklyTrend, overview } = response;

    this.breastfeedingDonutChart = {
      series: [breastfeedingStats.breastfeedingYes, breastfeedingStats.breastfeedingNo],
      chart: { type: 'donut', height: 320 },
      labels: ['Breastfeeding', 'Not breastfeeding'],
      colors: ['#6d8dff', '#ff4f75'],
      stroke: { width: 0 },
      legend: { position: 'bottom', fontSize: '13px' },
      dataLabels: { enabled: true },
      tooltip: { y: { formatter: (value: number) => `${value} mother(s)` } },
      plotOptions: { pie: { donut: { size: '64%' } } },
      responsive: [{ breakpoint: 768, options: { chart: { height: 280 } } }]
    };

    this.preferencesBarChart = {
      series: [{ name: 'Preferences', data: topPreferences.map(item => item.count) }],
      chart: { type: 'bar', height: 320, toolbar: { show: false }, animations: { enabled: true, speed: 700 } },
      colors: ['#f7a62c'],
      plotOptions: { bar: { borderRadius: 10, horizontal: true, barHeight: '48%' } },
      dataLabels: { enabled: true },
      stroke: { show: false },
      xaxis: {
        categories: topPreferences.map(item => item.preference),
        labels: { style: { fontSize: '12px', fontWeight: 600 } }
      },
      yaxis: { labels: { style: { fontSize: '12px', fontWeight: 700 } } },
      tooltip: { y: { formatter: (value: number) => `${value} recommendation(s)` } }
    };

    this.methodStatusChart = {
      series: [
        { name: 'Active', data: methodStatusMatrix.map(item => item.activeCount) },
        { name: 'Stopped', data: methodStatusMatrix.map(item => item.stoppedCount) },
        { name: 'Changed', data: methodStatusMatrix.map(item => item.changedCount) }
      ],
      chart: { type: 'bar', height: 350, stacked: true, toolbar: { show: false }, animations: { enabled: true, speed: 750 } },
      colors: ['#1dbf73', '#ef476f', '#6d8dff'],
      plotOptions: { bar: { borderRadius: 8, columnWidth: '46%' } },
      dataLabels: { enabled: false },
      stroke: { show: false },
      xaxis: {
        categories: methodStatusMatrix.map(item => item.method),
        labels: { style: { fontSize: '12px', fontWeight: 700 } }
      },
      yaxis: { labels: { style: { fontSize: '12px' } } },
      tooltip: { shared: true, intersect: false },
      legend: { position: 'top' }
    };

    this.weeklyTrendChart = {
      series: [{ name: 'Recommendations', data: weeklyTrend.map(item => item.recommendationsCount) }],
      chart: { type: 'area', height: 320, toolbar: { show: false }, animations: { enabled: true, speed: 750 } },
      colors: ['#ff4f75'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.28, opacityTo: 0.05 } },
      xaxis: {
        categories: weeklyTrend.map(item => item.weekLabel),
        labels: { rotate: -30, style: { fontSize: '12px', fontWeight: 600 } }
      },
      yaxis: { labels: { style: { fontSize: '12px' } } },
      tooltip: { y: { formatter: (value: number) => `${value} recommendation(s)` } }
    };

    this.conversionGaugeChart = {
      series: [overview.recommendationConversionRate, Math.max(0, 100 - overview.recommendationConversionRate)],
      chart: { type: 'donut', height: 270 },
      labels: ['Converted', 'Remaining'],
      colors: ['#ff4f75', '#f4dbe3'],
      stroke: { width: 0 },
      legend: { show: false, position: 'bottom' },
      dataLabels: { enabled: false },
      tooltip: { y: { formatter: (value: number) => `${this.formatDecimal(value)}%` } },
      plotOptions: { pie: { startAngle: -90, endAngle: 90, donut: { size: '72%' } } },
      responsive: [{ breakpoint: 768, options: { chart: { height: 240 } } }]
    };
  }

  // ─────────────────────────────────────────────
  // EXPORT CSV
  // ─────────────────────────────────────────────
  exportCsv(): void {
    if (!this.overview || this.exportingCsv) return;
    this.exportingCsv = true;

    const lines: string[] = [];
    const sep = ',';
    const stamp = this.getDateStamp();

    lines.push('Contraception Analytics Report');
    lines.push(`Generated on${sep}${stamp}`);
    lines.push('');

    lines.push('=== OVERVIEW ===');
    lines.push(`Metric${sep}Value`);
    lines.push(`Total recommendations${sep}${this.overview.totalRecommendations}`);
    lines.push(`Active methods count${sep}${this.overview.activeMethodsCount}`);
    lines.push(`Total chat messages${sep}${this.overview.totalChatMessages}`);
    lines.push(`Total chat sessions${sep}${this.overview.totalChatSessions}`);
    lines.push(`Conversion rate (%)${sep}${this.formatDecimal(this.overview.recommendationConversionRate)}`);
    lines.push(`Top recommended preference${sep}${this.escapeCsvValue(this.overview.topRecommendedPreference)}`);
    lines.push(`Top active method${sep}${this.escapeCsvValue(this.overview.topActiveMethod)}`);
    lines.push('');

    lines.push('=== EXECUTIVE INSIGHTS ===');
    lines.push(`Top insight${sep}${this.escapeCsvValue(this.topInsight)}`);
    lines.push(`Conversion insight${sep}${this.escapeCsvValue(this.conversionInsight)}`);
    lines.push('');

    if (this.analytics?.breastfeedingStats) {
      lines.push('=== BREASTFEEDING STATS ===');
      lines.push(`Category${sep}Count`);
      lines.push(`Breastfeeding${sep}${this.analytics.breastfeedingStats.breastfeedingYes}`);
      lines.push(`Not breastfeeding${sep}${this.analytics.breastfeedingStats.breastfeedingNo}`);
      lines.push('');
    }

    if (this.topPreferences.length) {
      lines.push('=== TOP PREFERENCES ===');
      lines.push(`Preference${sep}Count`);
      for (const row of this.topPreferences) {
        lines.push(`${this.escapeCsvValue(row.preference)}${sep}${row.count}`);
      }
      lines.push('');
    }

    if (this.methodStatusMatrix.length) {
      lines.push('=== METHOD STATUS MATRIX ===');
      lines.push(['Method', 'Active', 'Stopped', 'Changed'].join(sep));
      for (const row of this.methodStatusMatrix) {
        lines.push([
          this.escapeCsvValue(row.method),
          row.activeCount,
          row.stoppedCount,
          row.changedCount
        ].join(sep));
      }
      lines.push('');
    }

    if (this.analytics?.weeklyTrend?.length) {
      lines.push('=== WEEKLY TREND ===');
      lines.push(`Week${sep}Recommendations`);
      for (const row of this.analytics.weeklyTrend) {
        lines.push(`${this.escapeCsvValue(row.weekLabel)}${sep}${row.recommendationsCount}`);
      }
    }

    const bom = '\uFEFF';
    const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contraception-analytics-${stamp}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.exportingCsv = false;
  }

  // ─────────────────────────────────────────────
  // EXPORT PDF  (requires: npm install jspdf html2canvas)
  // ─────────────────────────────────────────────
  async exportPdf(): Promise<void> {
    if (!this.overview || this.exportingPdf) return;
    this.exportingPdf = true;

    try {
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

      const addPage = () => {
        doc.addPage();
        y = margin;
        doc.setFillColor(255, 79, 117);
        doc.rect(0, 0, pageW, 18, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('Contraception Analytics (continued)', margin, 12);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(255, 220, 230);
        doc.text(stamp, pageW - margin, 12, { align: 'right' });
        y = 26;
      };

      const ensureSpace = (needed: number) => { if (y + needed > pageH - 14) addPage(); };

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

      // ── Header band ──────────────────────────
      doc.setFillColor(255, 79, 117);
      doc.rect(0, 0, pageW, 36, 'F');
      doc.setFillColor(109, 141, 255);
      doc.rect(pageW - 50, 0, 50, 36, 'F');
      doc.setFillColor(255, 79, 117);
      doc.circle(pageW - 50, 18, 18, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('Contraception Analytics', margin, 16);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(255, 220, 230);
      doc.text('Postpartum contraception · AI recommendations & adoption dashboard', margin, 23);
      doc.text(`Generated: ${stamp}`, margin, 30);
      y = 44;

      // ── KPI grid ─────────────────────────────
      sectionTitle('KEY PERFORMANCE INDICATORS');
      const kpis = [
        { label: 'Total Recommendations', value: String(this.overview.totalRecommendations) },
        { label: 'Active Methods', value: String(this.overview.activeMethodsCount) },
        { label: 'Conversion Rate', value: `${this.formatDecimal(this.overview.recommendationConversionRate)}%` },
        { label: 'Chat Messages', value: String(this.overview.totalChatMessages) }
      ];
      const kpiH = 22;
      kpis.forEach((kpi, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const kx = margin + col * (colW + 8);
        const ky = y + row * (kpiH + 4);
        doc.setFillColor(255, 249, 251);
        doc.setDrawColor(255, 79, 117);
        doc.roundedRect(kx, ky, colW, 18, 4, 4, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(127, 102, 115);
        doc.text(kpi.label, kx + 4, ky + 6.5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(69, 40, 58);
        doc.text(kpi.value, kx + 4, ky + 14);
      });
      y += 2 * (kpiH + 4) + 10;

      // ── Overview table ────────────────────────
      sectionTitle('ANALYTICS OVERVIEW');
      const overviewRows: string[][] = [
        ['Total recommendations', String(this.overview.totalRecommendations)],
        ['Active methods', String(this.overview.activeMethodsCount)],
        ['Total chat messages', String(this.overview.totalChatMessages)],
        ['Total chat sessions', String(this.overview.totalChatSessions)],
        ['Conversion rate (%)', this.formatDecimal(this.overview.recommendationConversionRate)],
        ['Top recommended preference', this.overview.topRecommendedPreference],
        ['Top active method', this.overview.topActiveMethod]
      ];
      this.pdfTwoColTable(doc, overviewRows, ['Metric', 'Value'], [130, 46], margin, y);
      y += overviewRows.length * 9 + 18;

      // ── Breastfeeding stats ───────────────────
      if (this.analytics?.breastfeedingStats) {
        ensureSpace(36);
        sectionTitle('BREASTFEEDING CONTEXT');
        const bfRows: string[][] = [
          ['Breastfeeding', String(this.analytics.breastfeedingStats.breastfeedingYes)],
          ['Not breastfeeding', String(this.analytics.breastfeedingStats.breastfeedingNo)]
        ];
        this.pdfTwoColTable(doc, bfRows, ['Category', 'Count'], [130, 46], margin, y);
        y += bfRows.length * 9 + 18;
      }

      // ── Top preferences ───────────────────────
      if (this.topPreferences.length) {
        ensureSpace(50);
        sectionTitle('TOP PREFERENCES');
        const prefHeaders = ['Preference', 'Count'];
        const prefColW = [130, 46];
        const prefRows = this.topPreferences.map(r => [r.preference, String(r.count)]);
        this.pdfTwoColTable(doc, prefRows, prefHeaders, prefColW, margin, y);
        y += prefRows.length * 9 + 18;
      }

      // ── Method status matrix ──────────────────
      if (this.methodStatusMatrix.length) {
        ensureSpace(50);
        sectionTitle('METHOD STATUS MATRIX');
        const mHeaders = ['Method', 'Active', 'Stopped', 'Changed'];
        const mColW = [60, 30, 30, 30];
        const mRows = this.methodStatusMatrix.map(r => [
          r.method, String(r.activeCount), String(r.stoppedCount), String(r.changedCount)
        ]);
        this.pdfMatrixTable(doc, mRows, mHeaders, mColW, margin, y);
        y += mRows.length * 10 + 20;
      }

      // ── Weekly trend ──────────────────────────
      if (this.analytics?.weeklyTrend?.length) {
        ensureSpace(50);
        sectionTitle('WEEKLY RECOMMENDATION TREND');
        const wHeaders = ['Week', 'Recommendations'];
        const wColW = [110, 66];
        const wRows = this.analytics.weeklyTrend.map(r => [r.weekLabel, String(r.recommendationsCount)]);
        this.pdfTwoColTable(doc, wRows, wHeaders, wColW, margin, y);
        y += wRows.length * 9 + 18;
      }

      // ── Insights ──────────────────────────────
      ensureSpace(30);
      sectionTitle('EXECUTIVE INSIGHTS');
      for (const [icon, title, text] of [
        ['📊', 'Top Insight', this.topInsight],
        ['📈', 'Conversion Insight', this.conversionInsight]
      ]) {
        ensureSpace(26);
        doc.setFillColor(255, 249, 251);
        doc.setDrawColor(109, 141, 255);
        doc.roundedRect(margin, y, pageW - margin * 2, 22, 4, 4, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(69, 40, 58);
        doc.text(`${icon}  ${title}`, margin + 4, y + 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(127, 102, 115);
        const wrapped = doc.splitTextToSize(text, pageW - margin * 2 - 8);
        doc.text(wrapped, margin + 4, y + 16);
        y += 26;
      }

      // ── Footer ────────────────────────────────
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(250, 245, 248);
        doc.rect(0, pageH - 12, pageW, 12, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(165, 141, 153);
        doc.text('Contraception Analytics · Confidential medical report', margin, pageH - 4.5);
        doc.text(`Page ${p} / ${totalPages}`, pageW - margin, pageH - 4.5, { align: 'right' });
      }

      doc.save(`contraception-analytics-${stamp}.pdf`);

    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      this.exportingPdf = false;
    }
  }

  // ── PDF helpers ───────────────────────────────
  private pdfTwoColTable(doc: any, rows: string[][], headers: string[], colWidths: number[], x: number, startY: number): void {
    const rowH = 9;
    const totalW = colWidths[0] + colWidths[1];
    doc.setFillColor(255, 79, 117);
    doc.rect(x, startY, totalW, rowH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    headers.forEach((h, i) => doc.text(h, x + (i === 0 ? 3 : colWidths[0] + 5), startY + 6.2));

    rows.forEach((row, ri) => {
      const ry = startY + (ri + 1) * rowH;
      doc.setFillColor(ri % 2 === 0 ? 255 : 250, ri % 2 === 0 ? 249 : 247, ri % 2 === 0 ? 251 : 249);
      doc.rect(x, ry, totalW, rowH, 'F');
      row.forEach((cell, ci) => {
        doc.setFont('helvetica', ci === 0 ? 'bold' : 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(ci === 0 ? 69 : 127, ci === 0 ? 40 : 102, ci === 0 ? 58 : 115);
        doc.text(cell, x + (ci === 0 ? 3 : colWidths[0] + 5), ry + 6.2);
      });
    });
  }

  private pdfMatrixTable(doc: any, rows: string[][], headers: string[], colWidths: number[], x: number, startY: number): void {
    const rowH = 10;
    const totalW = colWidths.reduce((a, b) => a + b, 0);
    doc.setFillColor(255, 79, 117);
    doc.rect(x, startY, totalW, rowH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    let cx = x;
    headers.forEach((h, i) => { doc.text(h, cx + 3, startY + 7); cx += colWidths[i]; });

    rows.forEach((row, ri) => {
      const ry = startY + (ri + 1) * rowH;
      doc.setFillColor(ri % 2 === 0 ? 255 : 250, ri % 2 === 0 ? 249 : 247, ri % 2 === 0 ? 251 : 249);
      doc.rect(x, ry, totalW, rowH, 'F');
      let dx = x;
      row.forEach((cell, ci) => {
        doc.setFont('helvetica', ci === 0 ? 'bold' : 'normal');
        doc.setFontSize(8);
        doc.setTextColor(69, 40, 58);
        doc.text(cell, dx + 3, ry + 7);
        dx += colWidths[ci];
      });
      doc.setDrawColor(255, 79, 117);
      doc.setLineWidth(0.15);
      doc.line(x, ry + rowH, x + totalW, ry + rowH);
    });
    doc.setDrawColor(255, 79, 117);
    doc.setLineWidth(0.4);
    doc.rect(x, startY, totalW, (rows.length + 1) * rowH);
  }

  // ── Getters ───────────────────────────────────
  get overview(): ContraceptionAnalyticsOverview | null {
    return this.analytics?.overview ?? null;
  }

  get breastfeedingStats(): ContraceptionBreastfeedingStats | null {
    return this.analytics?.breastfeedingStats ?? null;
  }

  get topPreferences(): ContraceptionPreferenceItem[] {
    return this.analytics?.topPreferences ?? [];
  }

  get methodStatusMatrix(): ContraceptionMethodStatusItem[] {
    return this.analytics?.methodStatusMatrix ?? [];
  }

  get topInsight(): string {
    if (!this.overview) return '';
    return `The most frequent preference is "${this.overview.topRecommendedPreference}", while "${this.overview.topActiveMethod}" is currently the most common active contraception method.`;
  }

  get conversionInsight(): string {
    if (!this.overview) return '';
    return `The recommendation-to-adoption conversion rate is ${this.formatDecimal(this.overview.recommendationConversionRate)}%, showing how often mothers move from AI guidance to an active contraception choice.`;
  }

  formatDecimal(value: number): string {
    return Number(value ?? 0).toFixed(1);
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value ?? 0);
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
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}