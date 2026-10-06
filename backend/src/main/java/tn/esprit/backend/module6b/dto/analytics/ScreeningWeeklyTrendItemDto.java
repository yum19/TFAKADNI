package tn.esprit.backend.module6b.dto.analytics;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreeningWeeklyTrendItemDto {
    private String weekLabel;
    private long totalPredictions;
    private long lowCount;
    private long moderateCount;
    private long highCount;
}