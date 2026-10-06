package tn.esprit.backend.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;
import tn.esprit.backend.entity.HealthProfile;

import java.math.BigDecimal;

@Data
public class HealthProfileRequest {
    @Min(10)
    @Max(100)
    private Integer age;

    @DecimalMin("20.0")
    @DecimalMax("300.0")
    private BigDecimal weightKg;

    @Min(50)
    @Max(250)
    private Integer heightCm;

    private HealthProfile.BloodType bloodType;

    private String medicalHistoryJson;
}