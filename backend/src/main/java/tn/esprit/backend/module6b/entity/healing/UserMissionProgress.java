package tn.esprit.backend.module6b.entity.healing;

import jakarta.persistence.*;
import lombok.*;
import tn.esprit.backend.entity.User;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_mission_progress")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserMissionProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private User mother;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private HealingMission mission;

    @Enumerated(EnumType.STRING)
    private MissionStatus status;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    private LocalDate completedDate;

    private Integer pointsEarned;

    @Column(length = 1000)
    private String notes;

    // NEW
    private Boolean replayAttempt;

    // points removed when this replay fails
    private Integer penaltyApplied;
}