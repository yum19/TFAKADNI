package tn.esprit.backend.module6b.entity;

import tn.esprit.backend.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "screening_assessments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreeningAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "mother_id", nullable = false)
    private User mother;

    @Column(nullable = false)
    private LocalDateTime assessmentDate;

    @Column(nullable = false, length = 20)
    private String age;

    @Column(nullable = false, length = 50)
    private String feelingSadOrTearful;

    @Column(nullable = false, length = 50)
    private String irritableTowardsBabyPartner;

    @Column(nullable = false, length = 50)
    private String troubleSleepingAtNight;

    @Column(nullable = false, length = 50)
    private String problemsConcentratingOrMakingDecision;

    @Column(nullable = false, length = 50)
    private String overeatingOrLossOfAppetite;

    @Column(nullable = false, length = 50)
    private String feelingAnxious;

    @Column(nullable = false, length = 50)
    private String feelingOfGuilt;

    @Column(nullable = false, length = 50)
    private String problemsOfBondingWithBaby;

    @Column(nullable = false, length = 50)
    private String suicideAttempt;

    @Column(nullable = false)
    private Boolean sharedWithDoctor;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "screeningAssessment", cascade = CascadeType.ALL, orphanRemoval = true)
    private PredictionResult predictionResult;
}