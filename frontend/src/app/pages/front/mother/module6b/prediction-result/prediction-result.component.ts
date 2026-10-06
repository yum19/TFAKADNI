import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {
  PredictionResultService,
  PredictionResultResponseDto
} from '../../../../../core/services/module6b/prediction-result.service';
import {
  ScreeningAssessmentResponseDto,
  ScreeningAssessmentService
} from '../../../../../core/services/module6b/screening-assessment.service';

type ScreeningAnswerItem = {
  label: string;
  value: string;
};

@Component({
  selector: 'app-prediction-result',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  templateUrl: './prediction-result.component.html',
  styleUrls: ['./prediction-result.component.css']
})
export class PredictionResultComponent implements OnInit {
  results: PredictionResultResponseDto[] = [];
  filteredResults: PredictionResultResponseDto[] = [];
  paginatedResults: PredictionResultResponseDto[] = [];

  loading = true;
  errorMessage = '';

  showAnswersModal = false;
  answersLoading = false;
  answersError = '';
  selectedPrediction: PredictionResultResponseDto | null = null;
  selectedAssessment: ScreeningAssessmentResponseDto | null = null;
  screeningAnswerItems: ScreeningAnswerItem[] = [];

  selectedRiskFilter = 'ALL';
  sortDirection: 'desc' | 'asc' = 'desc';

  currentPage = 1;
  pageSize = 6;

  constructor(
    private predictionService: PredictionResultService,
    private screeningService: ScreeningAssessmentService
  ) {}

  ngOnInit(): void {
    this.loadPredictions();
  }

  loadPredictions(): void {
    this.loading = true;
    this.errorMessage = '';

    this.predictionService.getPredictionsByMother().subscribe({
      next: (data) => {
        console.log('Predictions loaded:', data);
        this.results = [...(data ?? [])];
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Load predictions error:', error);
        this.loading = false;
        this.errorMessage =
          error?.error?.message ||
          error?.error ||
          error?.message ||
          'Unable to load prediction results right now.';
      }
    });
  }

  applyFilters(): void {
    let list = [...this.results];

    if (this.selectedRiskFilter !== 'ALL') {
      list = list.filter(
        (item) => (item.riskLevel || '').toUpperCase() === this.selectedRiskFilter
      );
    }

    list.sort((a, b) => {
      const dateA = new Date(a.predictionDate).getTime();
      const dateB = new Date(b.predictionDate).getTime();
      return this.sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    });

    this.filteredResults = list;

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    this.updatePaginatedResults();
  }

  updatePaginatedResults(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedResults = this.filteredResults.slice(startIndex, endIndex);
  }

  onRiskFilterChange(filter: string): void {
    this.selectedRiskFilter = filter;
    this.currentPage = 1;
    this.applyFilters();
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'desc' ? 'asc' : 'desc';
    this.currentPage = 1;
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePaginatedResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredResults.length / this.pageSize) || 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get shouldShowPagination(): boolean {
    return this.filteredResults.length > this.pageSize;
  }

  openAnswersModal(result: PredictionResultResponseDto): void {
    this.selectedPrediction = result;
    this.selectedAssessment = null;
    this.screeningAnswerItems = [];
    this.answersError = '';
    this.answersLoading = true;
    this.showAnswersModal = true;

    this.screeningService.getAssessmentById(result.screeningId).subscribe({
      next: (assessment) => {
        this.selectedAssessment = assessment;
        this.screeningAnswerItems = this.buildAnswerItems(assessment);
        this.answersLoading = false;
      },
      error: () => {
        this.answersLoading = false;
        this.answersError = 'Unable to load the screening answers for this prediction.';
      }
    });
  }

  closeAnswersModal(): void {
    this.showAnswersModal = false;
    this.answersLoading = false;
    this.answersError = '';
    this.selectedPrediction = null;
    this.selectedAssessment = null;
    this.screeningAnswerItems = [];
  }

  private buildAnswerItems(assessment: ScreeningAssessmentResponseDto): ScreeningAnswerItem[] {
    return [
      { label: 'Age', value: assessment.age || 'N/A' },
      { label: 'Sad or tearful', value: assessment.feelingSadOrTearful || 'N/A' },
      { label: 'Irritable towards baby/partner', value: assessment.irritableTowardsBabyPartner || 'N/A' },
      { label: 'Trouble sleeping at night', value: assessment.troubleSleepingAtNight || 'N/A' },
      {
        label: 'Concentration / decision making',
        value: assessment.problemsConcentratingOrMakingDecision || 'N/A'
      },
      {
        label: 'Overeating or loss of appetite',
        value: assessment.overeatingOrLossOfAppetite || 'N/A'
      },
      { label: 'Feeling anxious', value: assessment.feelingAnxious || 'N/A' },
      { label: 'Feeling of guilt', value: assessment.feelingOfGuilt || 'N/A' },
      { label: 'Bonding with baby', value: assessment.problemsOfBondingWithBaby || 'N/A' },
      { label: 'Suicide attempt / thoughts', value: assessment.suicideAttempt || 'N/A' },
      {
        label: 'Shared with doctor',
        value: assessment.sharedWithDoctor ? 'Yes' : 'No'
      },
      {
        label: 'Assessment date',
        value: assessment.assessmentDate ? new Date(assessment.assessmentDate).toLocaleString() : 'N/A'
      }
    ];
  }

  get highPredictionCount(): number {
    return this.getRiskCount('high');
  }

  get moderatePredictionCount(): number {
    return this.getRiskCount('moderate');
  }

  get lowPredictionCount(): number {
    return this.getRiskCount('low');
  }

  private getRiskCount(level: string): number {
    const normalizedLevel = level.toLowerCase();

    return this.results.filter(
      (item) => (item.riskLevel || '').toLowerCase() === normalizedLevel
    ).length;
  }

  getRiskClass(level: string | undefined): string {
    const value = (level ?? '').toLowerCase();

    if (value === 'low') return 'risk-low';
    if (value === 'moderate') return 'risk-moderate';
    if (value === 'high') return 'risk-high';
    return 'risk-default';
  }

  getRiskIcon(level: string | undefined): string {
    const value = (level ?? '').toLowerCase();

    if (value === 'low') return 'sentiment_satisfied';
    if (value === 'moderate') return 'sentiment_neutral';
    if (value === 'high') return 'warning';
    return 'insights';
  }

  getRiskSummary(result: PredictionResultResponseDto): string {
    const value = (result.riskLevel ?? '').toLowerCase();

    if (value === 'low') {
      return 'The current prediction suggests a low level of postpartum risk and supports continued monitoring.';
    }

    if (value === 'moderate') {
      return 'The current prediction suggests moderate concern and may benefit from closer follow-up.';
    }

    if (value === 'high') {
      return 'The current prediction suggests high concern and follow-up should be prioritized.';
    }

    return 'Prediction summary unavailable.';
  }

  getConfidencePercent(confidence: number | undefined): number {
    if (confidence == null) return 0;
    return Math.round(confidence * 100);
  }

  formatProbability(value: number | undefined): string {
    if (value == null) return '0%';
    return `${Math.round(value * 100)}%`;
  }

  downloadPdf(result: PredictionResultResponseDto): void {
    const popup = window.open('', '_blank', 'width=900,height=900');
    if (!popup) return;

    const riskLevel = result.riskLevel ?? 'Unknown';
    const riskClass = this.getRiskClass(riskLevel);

    popup.document.write(`
      <html>
        <head>
          <title>Prediction Result #${result.id}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background: #fff;
              color: #3d3140;
              padding: 32px;
              line-height: 1.6;
            }
            .sheet {
              max-width: 820px;
              margin: 0 auto;
              border: 1px solid #f0dbe4;
              border-radius: 20px;
              padding: 28px;
            }
            .title {
              font-size: 32px;
              margin: 0 0 8px;
              color: #7a4660;
            }
            .sub {
              color: #8d7581;
              margin-bottom: 22px;
            }
            .badge {
              display: inline-block;
              padding: 8px 14px;
              border-radius: 999px;
              font-weight: 700;
              margin-bottom: 18px;
            }
            .risk-low .badge { background: #e8f8f1; color: #117a5d; }
            .risk-moderate .badge { background: #fff4df; color: #a56600; }
            .risk-high .badge { background: #ffe8eb; color: #c2415d; }
            .risk-default .badge { background: #f4f0f4; color: #756878; }

            .grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 14px;
              margin-top: 20px;
            }
            .card {
              border: 1px solid #f0dbe4;
              border-radius: 16px;
              padding: 16px;
              background: #fffafc;
            }
            .label {
              font-size: 13px;
              color: #967889;
              margin-bottom: 6px;
              font-weight: 700;
            }
            .value {
              font-size: 22px;
              font-weight: 800;
              color: #4d3b46;
            }
            .footer {
              margin-top: 26px;
              color: #977f8a;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="sheet ${riskClass}">
            <h1 class="title">Prediction Result</h1>
            <div class="sub">Postpartum screening model output summary</div>
            <div class="badge">${riskLevel} Risk</div>

            <div class="grid">
              <div class="card">
                <div class="label">Prediction ID</div>
                <div class="value">#${result.id}</div>
              </div>

              <div class="card">
                <div class="label">Screening ID</div>
                <div class="value">#${result.screeningId}</div>
              </div>

              <div class="card">
                <div class="label">Confidence</div>
                <div class="value">${this.getConfidencePercent(result.confidence)}%</div>
              </div>

              <div class="card">
                <div class="label">Model version</div>
                <div class="value">${result.modelVersion || 'N/A'}</div>
              </div>

              <div class="card">
                <div class="label">Low probability</div>
                <div class="value">${this.formatProbability(result.probabilityLow)}</div>
              </div>

              <div class="card">
                <div class="label">Moderate probability</div>
                <div class="value">${this.formatProbability(result.probabilityModerate)}</div>
              </div>

              <div class="card">
                <div class="label">High probability</div>
                <div class="value">${this.formatProbability(result.probabilityHigh)}</div>
              </div>

              <div class="card">
                <div class="label">Prediction date</div>
                <div class="value">${new Date(result.predictionDate).toLocaleString()}</div>
              </div>
            </div>

            <div class="footer">Generated from the prediction results page.</div>
          </div>
          <script>
            window.onload = function () { window.print(); };
          </script>
        </body>
      </html>
    `);

    popup.document.close();
  }

  deleteResult(screeningId: number): void {
    console.log('Deleting screeningId:', screeningId);

    const confirmed = window.confirm(
      'Do you want to delete this screening and its prediction result?'
    );
    if (!confirmed) return;

    this.loading = true;
    this.errorMessage = '';

    this.screeningService.deleteAssessment(screeningId).subscribe({
      next: (response) => {
        console.log('Delete success:', response);
        this.loadPredictions();
      },
      error: (error) => {
        console.error('Delete error full:', error);
        console.error('Delete error body:', error?.error);

        this.loading = false;
        this.errorMessage =
          error?.error?.message ||
          error?.error ||
          error?.message ||
          'Unable to delete this screening result right now.';
      }
    });
  }

  trackByResultId(index: number, item: PredictionResultResponseDto): number {
    return item.id;
  }

  trackByAnswerLabel(index: number, item: ScreeningAnswerItem): string {
    return item.label;
  }
}