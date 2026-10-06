package tn.esprit.backend.module6a.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BabyRhythmProfileResponseDTO {

    private Long id;
    private Long babyId;

    private Integer averageFeedingIntervalMinutes;
    private Integer averageSleepDurationMinutes;

    private LocalTime usualMorningWakeTime;
    private LocalTime usualNapTime;
    private LocalTime usualBedtime;

    private Integer nightWakeFrequency;
    private Integer rhythmStabilityScore;

    private LocalDateTime predictedNextFeeding;
    private LocalDateTime predictedNextSleep;

    private String rhythmLabel;
    private String explanation;
    private LocalDateTime lastCalculatedAt;
}