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
import {
  ScreeningAnalyticsOverview,
  ScreeningAnalyticsResponse,
  ScreeningRiskDistributionItem,
  ScreeningWeeklyTrendItem
} from '../../../core/services/module6b/screening-analytics.model';
import { ScreeningAnalyticsService } from '../../../core/services/module6b/screening-analytics.service';

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

interface MetricCard {
  label: string;
  value: string;
  helper: string;
  icon: string;
  tone: string;
}

@Component({
  selector: 'app-screening-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    NgApexchartsModule
  ],
  templateUrl: './screening-analytics.component.html',
  styleUrls: ['./screening-analytics.component.css']
})
export class ScreeningAnalyticsComponent implements OnInit {
  private screeningAnalyticsService = inject(ScreeningAnalyticsService);

  loading = true;
  error = '';
  exportingCsv = false;
  exportingPdf = false;
  analytics: ScreeningAnalyticsResponse | null = null;

  metrics: MetricCard[] = [];

  riskBarChart!: Partial<BarChartOptions>;
  riskDonutChart!: Partial<DonutChartOptions>;
  weeklyTrendChart!: Partial<BarChartOptions>;
  confidenceGaugeChart!: Partial<DonutChartOptions>;

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.error = '';

    this.screeningAnalyticsService.getAnalytics().subscribe({
      next: (response) => {
        this.analytics = response;
        this.buildMetrics(response.overview);
        this.buildCharts(response.overview, response.riskDistribution, response.weeklyTrend);
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load screening analytics right now. Please try again.';
        this.loading = false;
      }
    });
  }

  private buildMetrics(overview: ScreeningAnalyticsOverview): void {
    this.metrics = [
      {
        label: 'Total predictions',
        value: this.formatNumber(overview.totalPredictions),
        helper: `Model version: ${overview.latestModelVersion}`,
        icon: 'analytics',
        tone: 'tone-blue'
      },
      {
        label: 'Dominant risk',
        value: overview.dominantRiskLevel,
        helper: 'Most common AI prediction level',
        icon: 'insights',
        tone: 'tone-orange'
      },
      {
        label: 'Average confidence',
        value: `${this.formatDecimal(overview.averageConfidence)}%`,
        helper: 'Average AI confidence across all predictions',
        icon: 'verified',
        tone: 'tone-green'
      },
      {
        label: 'High risk cases',
        value: this.formatNumber(overview.highRiskCount),
        helper: 'Cases flagged as high priority by AI',
        icon: 'warning',
        tone: 'tone-red'
      }
    ];
  }

  private buildCharts(
    overview: ScreeningAnalyticsOverview,
    riskDistribution: ScreeningRiskDistributionItem[],
    weeklyTrend: ScreeningWeeklyTrendItem[]
  ): void {
    this.riskBarChart = {
      series: [
        {
          name: 'Predictions',
          data: [overview.lowRiskCount, overview.moderateRiskCount, overview.highRiskCount]
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
        bar: { borderRadius: 12, distributed: true, columnWidth: '42%' }
      },
      dataLabels: { enabled: true },
      stroke: { show: false },
      xaxis: {
        categories: ['Low', 'Moderate', 'High'],
        labels: { style: { fontSize: '13px', fontWeight: 700 } }
      },
      yaxis: { labels: { style: { fontSize: '12px' } } },
      tooltip: { y: { formatter: (value: number) => `${value} prediction(s)` } }
    };

    this.riskDonutChart = {
      series: riskDistribution.map(item => item.count),
      chart: { type: 'donut', height: 320 },
      labels: riskDistribution.map(item => item.riskLevel),
      colors: ['#6d8dff', '#f7a62c', '#ef476f'],
      stroke: { width: 0 },
      legend: { position: 'bottom', fontSize: '13px' },
      dataLabels: { enabled: true },
      tooltip: { y: { formatter: (value: number) => `${value} case(s)` } },
      plotOptions: { pie: { donut: { size: '62%' } } },
      responsive: [
        {
          breakpoint: 768,
          options: { chart: { height: 280 }, legend: { position: 'bottom' } }
        }
      ]
    };

    this.weeklyTrendChart = {
      series: [
        { name: 'Low', data: weeklyTrend.map(item => item.lowCount) },
        { name: 'Moderate', data: weeklyTrend.map(item => item.moderateCount) },
        { name: 'High', data: weeklyTrend.map(item => item.highCount) }
      ],
      chart: {
        type: 'area',
        height: 350,
        stacked: false,
        toolbar: { show: false },
        animations: { enabled: true, speed: 750 }
      },
      colors: ['#6d8dff', '#f7a62c', '#ef476f'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      fill: {
        type: 'gradient',
        gradient: { opacityFrom: 0.26, opacityTo: 0.04 }
      },
      xaxis: {
        categories: weeklyTrend.map(item => item.weekLabel),
        labels: { rotate: -35, style: { fontSize: '12px', fontWeight: 600 } }
      },
      yaxis: { labels: { style: { fontSize: '12px' } } },
      tooltip: { shared: true, intersect: false },
      legend: { position: 'top' }
    };

    this.confidenceGaugeChart = {
      series: [overview.averageConfidence, Math.max(0, 100 - overview.averageConfidence)],
      chart: { type: 'donut', height: 270 },
      labels: ['Confidence', 'Remaining'],
      colors: ['#ff4f75', '#f3e1e7'],
      stroke: { width: 0 },
      legend: { show: false, position: 'bottom' },
      dataLabels: { enabled: false },
      tooltip: { y: { formatter: (value: number) => `${this.formatDecimal(value)}%` } },
      plotOptions: {
        pie: { startAngle: -90, endAngle: 90, donut: { size: '72%' } }
      },
      responsive: [
        { breakpoint: 768, options: { chart: { height: 240 } } }
      ]
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

    // ── Section 1 : document header ───────────
    lines.push('Screening Analytics Report');
    lines.push(`Generated on${sep}${stamp}`);
    lines.push('');

    // ── Section 2 : overview KPIs ─────────────
    lines.push('=== OVERVIEW ===');
    lines.push(`Metric${sep}Value`);
    lines.push(`Total predictions${sep}${this.overview.totalPredictions}`);
    lines.push(`Dominant risk level${sep}${this.escapeCsvValue(this.overview.dominantRiskLevel)}`);
    lines.push(`Average confidence (%)${sep}${this.formatDecimal(this.overview.averageConfidence)}`);
    lines.push(`Low risk count${sep}${this.overview.lowRiskCount}`);
    lines.push(`Moderate risk count${sep}${this.overview.moderateRiskCount}`);
    lines.push(`High risk count${sep}${this.overview.highRiskCount}`);
    lines.push(`Latest model version${sep}${this.escapeCsvValue(this.overview.latestModelVersion)}`);
    lines.push('');

    // ── Section 3 : insights ──────────────────
    lines.push('=== EXECUTIVE INSIGHTS ===');
    lines.push(`Top insight${sep}${this.escapeCsvValue(this.topInsight)}`);
    lines.push(`Monitoring note${sep}${this.escapeCsvValue(this.monitoringInsight)}`);
    lines.push('');

    // ── Section 4 : risk distribution table ───
    lines.push('=== RISK DISTRIBUTION ===');
    lines.push(['Risk Level', 'Count', 'Percentage (%)', 'Color'].join(sep));
    for (const row of this.riskDistribution) {
      lines.push([
        this.escapeCsvValue(row.riskLevel),
        row.count,
        this.formatDecimal(row.percentage),
        this.escapeCsvValue(row.color)
      ].join(sep));
    }
    lines.push('');

    // ── Section 5 : weekly trend ──────────────
    lines.push('=== WEEKLY PREDICTION TREND ===');
    lines.push(['Week', 'Low', 'Moderate', 'High'].join(sep));
    for (const row of this.weeklyTrend) {
      lines.push([
        this.escapeCsvValue(row.weekLabel),
        row.lowCount,
        row.moderateCount,
        row.highCount
      ].join(sep));
    }

    // ── Build blob with UTF-8 BOM ─────────────
    const bom = '\uFEFF';
    const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `screening-analytics-${stamp}.csv`;
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

      // ── Helpers ─────────────────────────────
      const addPage = () => {
        doc.addPage();
        y = margin;
        this.pdfDrawContinuationHeader(doc, pageW, stamp);
        y = 26;
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

      const kpiBox = (label: string, value: string, x: number, boxY: number, w: number) => {
        doc.setFillColor(255, 249, 251);
        doc.setDrawColor(255, 79, 117);
        doc.roundedRect(x, boxY, w, 18, 4, 4, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(127, 102, 115);
        doc.text(label, x + 4, boxY + 6.5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(69, 40, 58);
        doc.text(value, x + 4, boxY + 14);
      };

      // ── Page 1 header band ───────────────────
      doc.setFillColor(255, 79, 117);
      doc.rect(0, 0, pageW, 36, 'F');
      doc.setFillColor(109, 141, 255);
      doc.rect(pageW - 50, 0, 50, 36, 'F');
      doc.setFillColor(255, 79, 117);
      doc.circle(pageW - 50, 18, 18, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('Screening Analytics', margin, 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(255, 220, 230);
      doc.text('Postpartum AI screening · Risk distribution & confidence dashboard', margin, 23);
      doc.text(`Generated: ${stamp}`, margin, 30);

      y = 44;

      // ── KPI grid 2×2 ─────────────────────────
      sectionTitle('KEY PERFORMANCE INDICATORS');

      const kpis = [
        { label: 'Total Predictions', value: String(this.overview.totalPredictions) },
        { label: 'Dominant Risk Level', value: this.overview.dominantRiskLevel },
        { label: 'Average Confidence', value: `${this.formatDecimal(this.overview.averageConfidence)}%` },
        { label: 'High Risk Cases', value: String(this.overview.highRiskCount) }
      ];

      const kpiH = 22;
      kpis.forEach((kpi, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        kpiBox(kpi.label, kpi.value, margin + col * (colW + 8), y + row * (kpiH + 4), colW);
      });
      y += 2 * (kpiH + 4) + 10;

      // ── Overview detail table ─────────────────
      sectionTitle('ANALYTICS OVERVIEW');

      const overviewRows: string[][] = [
        ['Total predictions', String(this.overview.totalPredictions)],
        ['Dominant risk level', this.overview.dominantRiskLevel],
        ['Average confidence (%)', this.formatDecimal(this.overview.averageConfidence)],
        ['Low risk count', String(this.overview.lowRiskCount)],
        ['Moderate risk count', String(this.overview.moderateRiskCount)],
        ['High risk count', String(this.overview.highRiskCount)],
        ['Latest model version', this.overview.latestModelVersion]
      ];

      this.pdfDrawTwoColTable(doc, overviewRows, ['Metric', 'Value'], [130, 46], margin, y, pageW);
      y += overviewRows.length * 9 + 18;

      // ── Risk distribution table ───────────────
      ensureSpace(50);
      sectionTitle('RISK DISTRIBUTION');

      const distHeaders = ['Risk Level', 'Count', 'Percentage (%)', 'Color'];
      const distColW = [40, 28, 40, 42];
      const distRows = this.riskDistribution.map(r => [
        r.riskLevel,
        String(r.count),
        this.formatDecimal(r.percentage),
        r.color
      ]);

      this.pdfDrawMatrixTable(doc, distRows, distHeaders, distColW, margin, y);
      y += distRows.length * 10 + 20;

      // ── Weekly trend table ────────────────────
      ensureSpace(50);
      sectionTitle('WEEKLY PREDICTION TREND');

      const trendHeaders = ['Week', 'Low', 'Moderate', 'High'];
      const trendColW = [60, 30, 36, 24];
      const trendRows = this.weeklyTrend.map(r => [
        r.weekLabel,
        String(r.lowCount),
        String(r.moderateCount),
        String(r.highCount)
      ]);

      this.pdfDrawMatrixTable(doc, trendRows, trendHeaders, trendColW, margin, y);
      y += trendRows.length * 10 + 20;

      // ── Executive insights ────────────────────
      ensureSpace(30);
      sectionTitle('EXECUTIVE INSIGHTS');

      const drawInsight = (icon: string, title: string, text: string) => {
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
      };

      drawInsight('📊', 'Top Insight', this.topInsight);
      drawInsight('⚠', 'Monitoring Note', this.monitoringInsight);
      y += 6;

      // ── Chart screenshot (best-effort) ────────
      const chartEl = document.querySelector('apx-chart') as HTMLElement | null;
      if (chartEl) {
        try {
          ensureSpace(80);
          sectionTitle('CHART PREVIEW');
          const canvas = await html2canvas(chartEl, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL('image/png');
          const imgW = pageW - margin * 2;
          const imgH = imgW / (canvas.width / canvas.height);
          ensureSpace(imgH + 6);
          doc.addImage(imgData, 'PNG', margin, y, imgW, imgH);
          y += imgH + 6;
        } catch (_) { /* skip */ }
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
        doc.text('Screening Analytics · Confidential medical report', margin, pageH - 4.5);
        doc.text(`Page ${p} / ${totalPages}`, pageW - margin, pageH - 4.5, { align: 'right' });
      }

      doc.save(`screening-analytics-${stamp}.pdf`);

    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      this.exportingPdf = false;
    }
  }

  // ── PDF helpers ───────────────────────────────
  private pdfDrawContinuationHeader(doc: any, pageW: number, stamp: string): void {
    doc.setFillColor(255, 79, 117);
    doc.rect(0, 0, pageW, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('Screening Analytics (continued)', 14, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 220, 230);
    doc.text(stamp, pageW - 14, 12, { align: 'right' });
  }

  private pdfDrawTwoColTable(
    doc: any,
    rows: string[][],
    headers: string[],
    colWidths: number[],
    x: number,
    startY: number,
    _pageW: number
  ): void {
    const rowH = 9;
    doc.setFillColor(255, 79, 117);
    doc.rect(x, startY, colWidths[0] + colWidths[1], rowH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    headers.forEach((h, i) => {
      doc.text(h, x + (i === 0 ? 3 : colWidths[0] + 5), startY + 6.2);
    });

    rows.forEach((row, ri) => {
      const ry = startY + (ri + 1) * rowH;
      doc.setFillColor(ri % 2 === 0 ? 255 : 250, ri % 2 === 0 ? 249 : 247, ri % 2 === 0 ? 251 : 249);
      doc.rect(x, ry, colWidths[0] + colWidths[1], rowH, 'F');
      row.forEach((cell, ci) => {
        doc.setFont('helvetica', ci === 0 ? 'bold' : 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(ci === 0 ? 69 : 127, ci === 0 ? 40 : 102, ci === 0 ? 58 : 115);
        const tx = ci === 0 ? x + 3 : x + colWidths[0] + 5;
        doc.text(cell, tx, ry + 6.2);
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

    rows.forEach((row, ri) => {
      const ry = startY + (ri + 1) * rowH;
      doc.setFillColor(ri % 2 === 0 ? 255 : 250, ri % 2 === 0 ? 249 : 247, ri % 2 === 0 ? 251 : 249);
      doc.rect(x, ry, totalW, rowH, 'F');
      let dx = x;
      row.forEach((cell, ci) => {
        doc.setFont('helvetica', ci === 0 ? 'bold' : 'normal');
        doc.setFontSize(8);
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
      doc.setDrawColor(255, 79, 117);
      doc.setLineWidth(0.15);
      doc.line(x, ry + rowH, x + totalW, ry + rowH);
    });

    doc.setDrawColor(255, 79, 117);
    doc.setLineWidth(0.4);
    doc.rect(x, startY, totalW, (rows.length + 1) * rowH);
  }

  // ── Getters ───────────────────────────────────
  get overview(): ScreeningAnalyticsOverview | null {
    return this.analytics?.overview ?? null;
  }

  get riskDistribution(): ScreeningRiskDistributionItem[] {
    return this.analytics?.riskDistribution ?? [];
  }

  get weeklyTrend(): ScreeningWeeklyTrendItem[] {
    return this.analytics?.weeklyTrend ?? [];
  }

  get topInsight(): string {
    if (!this.overview) return '';
    return `The AI currently classifies ${this.overview.dominantRiskLevel.toLowerCase()} as the dominant risk level, with an average confidence of ${this.formatDecimal(this.overview.averageConfidence)}%.`;
  }

  get monitoringInsight(): string {
    if (!this.overview) return '';
    return `${this.overview.highRiskCount} case(s) were flagged as high risk and should remain visible in admin monitoring workflows.`;
  }

  getToneClass(riskLevel: string): string {
    const value = riskLevel.toUpperCase();
    if (value === 'HIGH') return 'risk-high';
    if (value === 'MODERATE') return 'risk-mid';
    return 'risk-low';
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
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}