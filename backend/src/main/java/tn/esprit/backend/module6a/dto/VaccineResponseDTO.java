package tn.esprit.backend.module6a.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaccineResponseDTO {

    private Long id;
    private Long babyId;
    private String vaccineName;
    private LocalDate scheduledDate;
    private LocalDate takenDate;
    private String status;
    private LocalDate reminderDate;
    private String batchNumber;
    private String administeredBy;
    private String notes;
    private LocalDateTime createdAt;
}