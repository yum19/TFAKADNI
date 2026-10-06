package tn.esprit.backend.module6b.dto.healing;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoiceAnalysisRequestDto {
    private String expectedText;
    private String expectedVoiceStyle;
    private Integer minimumPassingScore;
    private String audioBase64;
    private String originalFilename;
    private String contentType;
}