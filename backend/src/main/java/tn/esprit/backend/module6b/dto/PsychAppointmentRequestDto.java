package tn.esprit.backend.module6b.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsychAppointmentRequestDto {

    private Long predictionResultId;
    private String psychologistName;

    @NotNull(message = "Appointment date is required")
    private LocalDateTime appointmentDate;

    private String type;
    private String status;
    private String location;
    private String notes;
}