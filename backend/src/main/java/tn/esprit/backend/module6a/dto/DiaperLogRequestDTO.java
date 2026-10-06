package tn.esprit.backend.module6a.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiaperLogRequestDTO {

    @NotNull(message = "Change time is required")
    private LocalDateTime changeTime;

    @NotBlank(message = "Diaper type is required")
    private String diaperType;

    private String color;
    private String consistency;
    private String notes;
}