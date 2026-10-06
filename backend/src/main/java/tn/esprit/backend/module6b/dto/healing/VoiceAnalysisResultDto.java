package tn.esprit.backend.module6b.dto.healing;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoiceAnalysisResultDto {
    private String transcript;
    private String detectedVoiceStyle;

    private Integer textScore;
    private Integer energyScore;
    private Integer paceScore;
    private Integer stabilityScore;
    private Integer pitchScore;
    private Integer finalScore;

    private Boolean accepted;
    private String feedback;
}