package tn.esprit.backend.module6b.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportResourceRequestDto {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Type is required")
    private String type;

    @NotBlank(message = "Category is required")
    private String category;

    private String description;

    private String url;

    private String contentText;

    private String phoneNumber;

    private String thumbnailUrl;

    private String displayMode;

    private Integer estimatedMinutes;

    private Boolean isRecommended;

    @NotBlank(message = "Language is required")
    private String language;

    @NotBlank(message = "Risk level target is required")
    private String riskLevelTarget;

    private Boolean isActive;
}