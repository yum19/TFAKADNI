package tn.esprit.backend.module6a.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SleepLogRequestDTO {

    @NotNull(message = "Sleep start is required")
    private LocalDateTime sleepStart;

    private LocalDateTime sleepEnd;
    private String quality;
    private String notes;
}