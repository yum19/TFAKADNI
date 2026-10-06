package tn.esprit.backend.module6a.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SleepLogResponseDTO {

    private Long id;
    private Long babyId;
    private LocalDateTime sleepStart;
    private LocalDateTime sleepEnd;
    private Integer duration;
    private String quality;
    private String notes;
    private LocalDateTime createdAt;
}