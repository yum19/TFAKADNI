export interface ContraceptionAnalyticsOverview {
  totalRecommendations: number;
  activeMethodsCount: number;
  totalChatMessages: number;
  totalChatSessions: number;
  recommendationConversionRate: number;
  topRecommendedPreference: string;
  topActiveMethod: string;
}

export interface ContraceptionBreastfeedingStats {
  breastfeedingYes: number;
  breastfeedingNo: number;
}

export interface ContraceptionPreferenceItem {
  preference: string;
  count: number;
}

export interface ContraceptionMethodStatusItem {
  method: string;
  activeCount: number;
  stoppedCount: number;
  changedCount: number;
}

export interface ContraceptionWeeklyTrendItem {
  weekLabel: string;
  recommendationsCount: number;
}

export interface ContraceptionAnalyticsResponse {
  overview: ContraceptionAnalyticsOverview;
  breastfeedingStats: ContraceptionBreastfeedingStats;
  topPreferences: ContraceptionPreferenceItem[];
  methodStatusMatrix: ContraceptionMethodStatusItem[];
  weeklyTrend: ContraceptionWeeklyTrendItem[];
}