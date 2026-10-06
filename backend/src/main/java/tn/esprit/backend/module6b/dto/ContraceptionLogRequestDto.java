package tn.esprit.backend.module6b.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContraceptionLogRequestDto {

    @NotBlank(message = "Method is required")
    private String method;

    private LocalDate startDate;
    private LocalDate endDate;
    private String sideEffects;
    private String notes;
    private String status;
}