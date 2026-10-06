package tn.esprit.backend.module6b.dto.healing;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoiceMissionConfigResponseDto {
    private Long missionId;
    private String expectedText;
    private String expectedVoiceStyle;
    private Integer minimumPassingScore;
    private String referenceAudioUrl;
}