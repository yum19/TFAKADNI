package tn.esprit.backend.module6b.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreeningAssessmentRequestDto {

    @NotBlank(message = "Age is required")
    private String age;

    @NotBlank(message = "feelingSadOrTearful is required")
    private String feelingSadOrTearful;

    @NotBlank(message = "irritableTowardsBabyPartner is required")
    private String irritableTowardsBabyPartner;

    @NotBlank(message = "troubleSleepingAtNight is required")
    private String troubleSleepingAtNight;

    @NotBlank(message = "problemsConcentratingOrMakingDecision is required")
    private String problemsConcentratingOrMakingDecision;

    @NotBlank(message = "overeatingOrLossOfAppetite is required")
    private String overeatingOrLossOfAppetite;

    @NotBlank(message = "feelingAnxious is required")
    private String feelingAnxious;

    @NotBlank(message = "feelingOfGuilt is required")
    private String feelingOfGuilt;

    @NotBlank(message = "problemsOfBondingWithBaby is required")
    private String problemsOfBondingWithBaby;

    @NotBlank(message = "suicideAttempt is required")
    private String suicideAttempt;

    @NotNull(message = "sharedWithDoctor is required")
    private Boolean sharedWithDoctor;
}