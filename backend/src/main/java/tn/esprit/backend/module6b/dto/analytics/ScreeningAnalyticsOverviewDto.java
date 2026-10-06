package tn.esprit.backend.module6b.dto.analytics;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreeningAnalyticsOverviewDto {
    private long totalPredictions;
    private long lowRiskCount;
    private long moderateRiskCount;
    private long highRiskCount;
    private double averageConfidence;
    private String dominantRiskLevel;
    private String latestModelVersion;
}