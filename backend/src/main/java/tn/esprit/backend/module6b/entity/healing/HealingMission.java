package tn.esprit.backend.module6b.entity.healing;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "healing_missions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealingMission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    private MissionType missionType;

    @Enumerated(EnumType.STRING)
    private MissionDifficulty difficulty;

    private Integer pointsReward;

    private Integer durationSeconds;

    private String mediaUrl;

    private String thumbnailUrl;

    private Boolean active;

    private String recommendedForRiskLevel;

    private String recommendedForEmotion;

    private LocalDateTime createdAt;

    @Column(length = 500)
    private String expectedText;

    @Enumerated(EnumType.STRING)
    private VoiceStyle expectedVoiceStyle;

    private Integer minimumPassingScore;
}