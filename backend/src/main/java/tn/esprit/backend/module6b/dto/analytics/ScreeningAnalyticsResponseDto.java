package tn.esprit.backend.module6b.dto.analytics;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreeningAnalyticsResponseDto {
    private ScreeningAnalyticsOverviewDto overview;
    private List<ScreeningRiskDistributionItemDto> riskDistribution;
    private List<ScreeningWeeklyTrendItemDto> weeklyTrend;
}