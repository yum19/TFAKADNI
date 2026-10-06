export interface ScreeningAppointmentOverview {
  totalPredictions: number;
  lowRiskCount: number;
  moderateRiskCount: number;
  highRiskCount: number;
  highRiskWithAppointment: number;
  highRiskWithoutAppointment: number;
  highRiskFollowUpRate: number;
  averageDelayDays: number;
  plannedAppointmentsLinkedToPrediction: number;
  completedAppointmentsLinkedToPrediction: number;
  cancelledAppointmentsLinkedToPrediction: number;
}

export interface RiskAppointmentStatusRow {
  riskLevel: string;
  totalPredictions: number;
  linkedAppointments: number;
  noAppointment: number;
  plannedCount: number;
  completedCount: number;
  cancelledCount: number;
}

export interface FollowUpAnalyticsResponse {
  overview: ScreeningAppointmentOverview;
  matrix: RiskAppointmentStatusRow[];
}