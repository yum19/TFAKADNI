package tn.esprit.backend.module6b.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportResourceResponseDto {

    private Long id;
    private String title;
    private String type;
    private String category;
    private String description;
    private String url;
    private String contentText;
    private String phoneNumber;
    private String thumbnailUrl;
    private String displayMode;
    private Integer estimatedMinutes;
    private Boolean isRecommended;
    private String language;
    private String riskLevelTarget;
    private Boolean isActive;
}