package tn.esprit.backend.module6a.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BabyAppointmentRequestDTO {

    @NotNull(message = "Appointment date is required")
    private LocalDateTime appointmentDate;

    @NotBlank(message = "Doctor name is required")
    private String doctorName;

    @NotBlank(message = "Appointment type is required")
    private String type;

    private String location;

    @NotBlank(message = "Appointment status is required")
    private String status;

    private LocalDateTime reminderDate;
    private String notes;
}