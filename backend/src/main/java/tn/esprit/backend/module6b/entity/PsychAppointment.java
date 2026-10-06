package tn.esprit.backend.module6b.entity;

import tn.esprit.backend.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "psych_appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsychAppointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "mother_id", nullable = false)
    private User mother;

    @ManyToOne
    @JoinColumn(name = "prediction_result_id")
    private PredictionResult predictionResult;

    @Column(name = "psychologist_name", length = 120)
    private String psychologistName;

    @Column(nullable = false)
    private LocalDateTime appointmentDate;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(length = 200)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}