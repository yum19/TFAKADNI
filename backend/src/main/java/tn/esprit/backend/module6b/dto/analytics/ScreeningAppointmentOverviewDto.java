package tn.esprit.backend.module6b.dto.analytics;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreeningAppointmentOverviewDto {

    private long totalPredictions;

    private long lowRiskCount;
    private long moderateRiskCount;
    private long highRiskCount;

    private long highRiskWithAppointment;
    private long highRiskWithoutAppointment;

    private double highRiskFollowUpRate;

    private double averageDelayDays;

    private long plannedAppointmentsLinkedToPrediction;
    private long completedAppointmentsLinkedToPrediction;
    private long cancelledAppointmentsLinkedToPrediction;
}