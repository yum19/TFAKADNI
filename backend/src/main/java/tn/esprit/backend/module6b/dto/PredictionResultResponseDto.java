package tn.esprit.backend.module6b.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictionResultResponseDto {
    private Long id;
    private Long screeningId;
    private Integer riskLabel;
    private String riskLevel;
    private Double confidence;
    private Double probabilityLow;
    private Double probabilityModerate;
    private Double probabilityHigh;
    private LocalDateTime predictionDate;
    private String modelVersion;
}