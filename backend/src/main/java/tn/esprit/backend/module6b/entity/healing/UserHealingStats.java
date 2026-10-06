package tn.esprit.backend.module6b.entity.healing;

import jakarta.persistence.*;
import lombok.*;
import tn.esprit.backend.entity.User;

import java.time.LocalDate;

@Entity
@Table(name = "user_healing_stats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserHealingStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    private User mother;
    private int coins;
    private Integer totalPoints;

    private Integer currentLevel;

    private Integer currentStreak;

    private Integer longestStreak;

    private LocalDate lastCompletedMissionDate;

    private Integer completedMissionsCount;
}