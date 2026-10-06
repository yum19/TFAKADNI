package tn.esprit.backend.module6b.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictionResultRequestDto {

    @NotNull(message = "Risk label is required")
    private Integer riskLabel;

    @NotBlank(message = "Risk level is required")
    private String riskLevel;

    @NotNull(message = "Confidence is required")
    @PositiveOrZero(message = "Confidence cannot be negative")
    private Double confidence;

    @NotNull(message = "Probability low is required")
    @PositiveOrZero(message = "Probability low cannot be negative")
    private Double probabilityLow;

    @NotNull(message = "Probability moderate is required")
    @PositiveOrZero(message = "Probability moderate cannot be negative")
    private Double probabilityModerate;

    @NotNull(message = "Probability high is required")
    @PositiveOrZero(message = "Probability high cannot be negative")
    private Double probabilityHigh;

    @NotBlank(message = "Model version is required")
    private String modelVersion;
}