package tn.esprit.backend.module6a.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrowthRecordResponseDTO {

    private Long id;
    private Long babyId;
    private LocalDate recordDate;
    private Double weight;
    private Double height;
    private Double headCircumference;
    private Double bmi;
    private String notes;
    private LocalDateTime createdAt;
}