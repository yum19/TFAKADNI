package tn.esprit.backend.module6a.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedingRequestDTO {

    @NotNull(message = "Feeding date is required")
    private LocalDate feedingDate;

    @NotNull(message = "Feeding time is required")
    private LocalTime feedingTime;

    @NotBlank(message = "Feeding mode is required")
    private String feedingMode;

    @PositiveOrZero(message = "Quantity cannot be negative")
    private Double quantity;

    @PositiveOrZero(message = "Duration cannot be negative")
    private Integer duration;

    private String sideUsed;
    private String notes;
}