package tn.esprit.backend.module6b.dto.healing;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealingStatsResponseDto {
    private Integer coins;
    private Integer totalPoints;
    private Integer currentLevel;
    private Integer currentStreak;
    private Integer longestStreak;
    private Integer completedMissionsCount;
    private Integer pointsToNextLevel;
}