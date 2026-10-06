package tn.esprit.backend.module6b.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "prediction_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictionResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "screening_id", nullable = false, unique = true)
    @JsonIgnore
    private ScreeningAssessment screeningAssessment;

    @Column(nullable = false)
    private Integer riskLabel;

    @Column(nullable = false)
    private String riskLevel;

    @Column(nullable = false)
    private Double confidence;

    @Column(nullable = false)
    private Double probabilityLow;

    @Column(nullable = false)
    private Double probabilityModerate;

    @Column(nullable = false)
    private Double probabilityHigh;

    @Column(nullable = false)
    private LocalDateTime predictionDate;

    @Column(nullable = false)
    private String modelVersion;
}