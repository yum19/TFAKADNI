package tn.esprit.backend.module6b.dto.healing;

import lombok.*;
import tn.esprit.backend.module6b.entity.healing.MissionDifficulty;
import tn.esprit.backend.module6b.entity.healing.MissionStatus;
import tn.esprit.backend.module6b.entity.healing.MissionType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealingMissionResponseDto {
    private Long id;
    private String title;
    private String description;
    private MissionType missionType;
    private MissionDifficulty difficulty;
    private Integer pointsReward;
    private Integer durationSeconds;
    private String mediaUrl;
    private String thumbnailUrl;
    private MissionStatus status;
    private boolean completedToday;

    private String expectedText;
    private String expectedVoiceStyle;
    private Integer minimumPassingScore;
}