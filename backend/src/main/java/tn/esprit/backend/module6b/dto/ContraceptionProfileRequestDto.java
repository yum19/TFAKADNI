package tn.esprit.backend.module6b.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContraceptionProfileRequestDto {

    @NotBlank(message = "Age is required")
    private String age;

    @NotNull(message = "Breastfeeding flag is required")
    private Boolean isBreastfeeding;

    private String medicalHistory;
    private String preference;
}