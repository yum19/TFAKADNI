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
public class ReminderRequestDTO {

    @NotBlank(message = "Reminder type is required")
    private String type;

    @NotNull(message = "Reminder date is required")
    private LocalDateTime reminderDate;

    @NotBlank(message = "Reminder message is required")
    private String message;

    @NotBlank(message = "Reminder status is required")
    private String status;
}