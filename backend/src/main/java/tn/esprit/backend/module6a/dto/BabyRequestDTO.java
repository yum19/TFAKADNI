package tn.esprit.backend.module6a.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BabyRequestDTO {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotNull(message = "Birth date is required")
    @PastOrPresent(message = "Birth date cannot be in the future")
    private LocalDate birthDate;

    @NotBlank(message = "Gender is required")
    private String gender;

    @Positive(message = "Birth weight must be greater than 0")
    private Double birthWeight;

    @Positive(message = "Birth height must be greater than 0")
    private Double birthHeight;

    private String bloodType;
    private String birthPlace;

    @Positive(message = "Gestational age must be greater than 0")
    private Integer gestationalAgeAtBirth;

    private String deliveryType;
    private String photoUrl;
    private String notes;
}