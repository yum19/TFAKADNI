package tn.esprit.backend.module6b.dto.analytics;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreeningAppointmentAnalyticsResponseDto {

    private ScreeningAppointmentOverviewDto overview;
    private List<RiskAppointmentStatusRowDto> matrix;
}