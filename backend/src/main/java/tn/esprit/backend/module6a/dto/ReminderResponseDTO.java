package tn.esprit.backend.module6a.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReminderResponseDTO {

    private Long id;
    private Long babyId;
    private String type;
    private LocalDateTime reminderDate;
    private String message;
    private String status;
    private String sourceType;
    private Long sourceId;
    private LocalDateTime createdAt;
    private Boolean overdue;
}