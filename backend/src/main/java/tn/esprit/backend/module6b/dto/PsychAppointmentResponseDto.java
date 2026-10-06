package tn.esprit.backend.module6b.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsychAppointmentResponseDto {
    private Long id;
    private Long motherId;
    private Long predictionResultId;
    private String psychologistName;
    private LocalDateTime appointmentDate;
    private String type;
    private String status;
    private String location;
    private String notes;
    private LocalDateTime createdAt;
}