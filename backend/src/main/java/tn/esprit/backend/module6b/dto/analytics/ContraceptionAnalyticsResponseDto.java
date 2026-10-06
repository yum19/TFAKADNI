package tn.esprit.backend.module6b.dto.analytics;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContraceptionAnalyticsResponseDto {
    private ContraceptionAnalyticsOverviewDto overview;
    private ContraceptionBreastfeedingStatsDto breastfeedingStats;
    private List<ContraceptionPreferenceItemDto> topPreferences;
    private List<ContraceptionMethodStatusItemDto> methodStatusMatrix;
    private List<ContraceptionWeeklyTrendItemDto> weeklyTrend;
}