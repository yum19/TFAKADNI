package tn.esprit.backend.module6a.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BabyInsightResponseDTO {

    private Long id;
    private Long babyId;
    private String insightType;
    private String title;
    private String message;
    private String priority;
    private String sourceModule;
    private LocalDateTime generatedAt;
    private Boolean isRead;
    private String status;
    private String actionLabel;
    private String actionUrl;
    private Double confidenceScore;
    private String generatedBy;

    private String ruleCode;
    private String reason;
    private String evidenceSummary;

    private LocalDateTime readAt;
    private LocalDateTime dismissedAt;
    private LocalDateTime resolvedAt;
}