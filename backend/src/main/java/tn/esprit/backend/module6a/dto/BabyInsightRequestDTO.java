package tn.esprit.backend.module6a.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BabyInsightRequestDTO {

    private String insightType;
    private String title;
    private String message;
    private String priority;
    private String sourceModule;
    private String actionLabel;
    private String actionUrl;
    private Double confidenceScore;
    private String generatedBy;
}