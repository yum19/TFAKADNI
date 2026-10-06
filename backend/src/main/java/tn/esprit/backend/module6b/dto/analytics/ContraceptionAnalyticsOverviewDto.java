package tn.esprit.backend.module6b.dto.analytics;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContraceptionAnalyticsOverviewDto {
    private long totalRecommendations;
    private long activeMethodsCount;
    private long totalChatMessages;
    private long totalChatSessions;
    private double recommendationConversionRate;
    private String topRecommendedPreference;
    private String topActiveMethod;
}