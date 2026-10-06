package tn.esprit.backend.module6b.dto.analytics;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreeningRiskDistributionItemDto {
    private String riskLevel;
    private long count;
    private double percentage;
    private String color;
}