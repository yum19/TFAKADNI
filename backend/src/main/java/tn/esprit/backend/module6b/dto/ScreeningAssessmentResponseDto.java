package tn.esprit.backend.module6b.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreeningAssessmentResponseDto {
    private Long id;
    private Long motherId;
    private LocalDateTime assessmentDate;
    private String age;
    private String feelingSadOrTearful;
    private String irritableTowardsBabyPartner;
    private String troubleSleepingAtNight;
    private String problemsConcentratingOrMakingDecision;
    private String overeatingOrLossOfAppetite;
    private String feelingAnxious;
    private String feelingOfGuilt;
    private String problemsOfBondingWithBaby;
    private String suicideAttempt;
    private Boolean sharedWithDoctor;
    private LocalDateTime createdAt;
}