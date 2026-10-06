package tn.esprit.backend.module6a.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BabyMilestoneResponseDTO {

    private Long id;
    private Long babyId;
    private String title;
    private String category;
    private LocalDate milestoneDate;
    private String description;
    private String mediaUrl;
    private String mediaType;
    private LocalDateTime createdAt;
    private Boolean recent;
}