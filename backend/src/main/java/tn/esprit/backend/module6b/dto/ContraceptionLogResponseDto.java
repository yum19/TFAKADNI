package tn.esprit.backend.module6b.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContraceptionLogResponseDto {
    private Long id;
    private Long motherId;
    private String method;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String sideEffects;
    private String notes;
    private LocalDateTime createdAt;
}