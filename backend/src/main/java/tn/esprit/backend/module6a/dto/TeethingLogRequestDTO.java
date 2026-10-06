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
public class TeethingLogRequestDTO {

    @NotBlank(message = "Tooth label is required")
    private String toothLabel;

    @NotNull(message = "Eruption date is required")
    private LocalDate eruptionDate;

    private String symptoms;
    private String notes;
}