export interface ScreeningAnalyticsOverview {
  totalPredictions: number;
  lowRiskCount: number;
  moderateRiskCount: number;
  highRiskCount: number;
  averageConfidence: number;
  dominantRiskLevel: string;
  latestModelVersion: string;
}

export interface ScreeningRiskDistributionItem {
  riskLevel: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ScreeningWeeklyTrendItem {
  weekLabel: string;
  totalPredictions: number;
  lowCount: number;
  moderateCount: number;
  highCount: number;
}

export interface ScreeningAnalyticsResponse {
  overview: ScreeningAnalyticsOverview;
  riskDistribution: ScreeningRiskDistributionItem[];
  weeklyTrend: ScreeningWeeklyTrendItem[];
}