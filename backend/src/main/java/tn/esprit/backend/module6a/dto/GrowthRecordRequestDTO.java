package tn.esprit.backend.module6a.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrowthRecordRequestDTO {

    @NotNull(message = "Record date is required")
    private LocalDate recordDate;

    @NotNull(message = "Weight is required")
    @Positive(message = "Weight must be greater than 0")
    private Double weight;

    @NotNull(message = "Height is required")
    @Positive(message = "Height must be greater than 0")
    private Double height;

    @Positive(message = "Head circumference must be greater than 0")
    private Double headCircumference;

    private String notes;
}