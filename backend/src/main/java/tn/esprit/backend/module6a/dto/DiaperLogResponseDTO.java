package tn.esprit.backend.module6a.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiaperLogResponseDTO {

    private Long id;
    private Long babyId;
    private LocalDateTime changeTime;
    private String diaperType;
    private String color;
    private String consistency;
    private String notes;
    private LocalDateTime createdAt;
}