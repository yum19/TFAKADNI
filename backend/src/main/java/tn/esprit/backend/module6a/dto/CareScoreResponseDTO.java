package tn.esprit.backend.module6a.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareScoreResponseDTO {

    private Long babyId;

    private Integer score; // 0 -> 100
    private String level;  // LOW / MEDIUM / GOOD / EXCELLENT
    private String explanation;

    private Boolean feedingFollowed;
    private Boolean sleepFollowed;
    private Boolean diaperFollowed;
    private Boolean growthUpToDate;
    private Boolean vaccineFollowed;
    private Boolean remindersUnderControl;

    private Integer feedingPoints;
    private Integer sleepPoints;
    private Integer diaperPoints;
    private Integer growthPoints;
    private Integer vaccinePoints;
    private Integer reminderPoints;
}