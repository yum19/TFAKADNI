package tn.esprit.backend.module6a.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeethingLogResponseDTO {

    private Long id;
    private Long babyId;
    private String toothLabel;
    private LocalDate eruptionDate;
    private String symptoms;
    private String notes;
    private LocalDateTime createdAt;
}