package tn.esprit.backend.module6a.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedingResponseDTO {

    private Long id;
    private Long babyId;
    private LocalDate feedingDate;
    private LocalTime feedingTime;
    private String feedingMode;
    private Double quantity;
    private Integer duration;
    private String sideUsed;
    private String notes;
    private LocalDateTime createdAt;
}