package tn.esprit.backend.module6b.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContraceptionProfileResponseDto {
    private Long id;
    private Long motherId;
    private String age;
    private Boolean isBreastfeeding;
    private String medicalHistory;
    private String preference;
    private String aiRecommendation;
    private LocalDateTime createdAt;
}