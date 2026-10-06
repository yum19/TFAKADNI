package tn.esprit.backend.module6a.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BabyMilestoneRequestDTO {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Milestone date is required")
    private LocalDate milestoneDate;

    private String description;
    private String mediaUrl;
    private String mediaType;
}