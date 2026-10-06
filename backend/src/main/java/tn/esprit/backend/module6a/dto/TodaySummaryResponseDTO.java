package tn.esprit.backend.module6a.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TodaySummaryResponseDTO {

    private Long babyId;
    private String date;

    private Integer feedingCount;
    private Double totalFeedingQuantity;
    private Integer sleepCount;
    private Integer totalSleepMinutes;
    private Integer diaperCount;

    private Integer vaccineCountToday;
    private Integer appointmentCountToday;
    private Integer reminderCountToday;
    private Integer unreadInsightCount;

    private Boolean attentionNeeded;

    private String summaryTitle;
    private String summaryText;
}