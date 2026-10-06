package tn.esprit.backend.module6a.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BabyAppointmentResponseDTO {

    private Long id;
    private Long babyId;
    private LocalDateTime appointmentDate;
    private String doctorName;
    private String type;
    private String location;
    private String status;
    private LocalDateTime reminderDate;
    private String notes;
    private LocalDateTime createdAt;
    private Boolean upcoming;
}