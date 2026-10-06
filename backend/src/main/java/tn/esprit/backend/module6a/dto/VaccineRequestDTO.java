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
public class VaccineRequestDTO {

    @NotBlank(message = "Vaccine name is required")
    private String vaccineName;

    @NotNull(message = "Scheduled date is required")
    private LocalDate scheduledDate;

    private LocalDate takenDate;

    @NotBlank(message = "Vaccine status is required")
    private String status;

    private LocalDate reminderDate;
    private String batchNumber;
    private String administeredBy;
    private String notes;
}