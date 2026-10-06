package tn.esprit.backend.module6a.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BabyPredictionResponseDTO {

    private Long babyId;
    private String predictionType; // NEXT_FEEDING / NEXT_SLEEP
    private LocalDateTime predictedDateTime;
    private Integer confidenceScore;
    private String explanation;
    private Integer basedOnDays;
}