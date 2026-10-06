package tn.esprit.backend.module6b.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MoodLogResponseDto {
    private Long id;
    private Long motherId;
    private LocalDate logDate;
    private Integer moodScore;
    private String emotionType;
    private String notes;
    private Boolean isShared;
    private LocalDateTime createdAt;
}