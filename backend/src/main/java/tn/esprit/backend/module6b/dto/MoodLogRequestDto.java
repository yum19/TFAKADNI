package tn.esprit.backend.module6b.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MoodLogRequestDto {

    @NotNull(message = "Log date is required")
    private LocalDate logDate;

    @NotNull(message = "Mood score is required")
    private Integer moodScore;

    private String emotionType;
    private String notes;
    private Boolean isShared;
}