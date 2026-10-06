package tn.esprit.backend.module6b.dto.analytics;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAppointmentStatusRowDto {

    private String riskLevel;
    private long totalPredictions;
    private long linkedAppointments;
    private long noAppointment;
    private long plannedCount;
    private long completedCount;
    private long cancelledCount;
}