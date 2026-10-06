package tn.esprit.backend.module6b.dto.healing;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealingMissionCompleteResponseDto {
    private Long missionId;
    private String message;
    private Integer pointsEarned;
    private Integer totalPoints;
    private Integer currentLevel;
    private Integer currentStreak;

}