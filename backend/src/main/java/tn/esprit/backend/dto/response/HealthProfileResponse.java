package tn.esprit.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import tn.esprit.backend.entity.HealthProfile;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class HealthProfileResponse {
    private Long id;
    private Integer age;
    private BigDecimal weightKg;
    private Integer heightCm;
    private HealthProfile.BloodType bloodType;
    private String medicalHistoryJson;
    private LocalDateTime updatedAt;
    private String firstName;
    private String lastName;
}