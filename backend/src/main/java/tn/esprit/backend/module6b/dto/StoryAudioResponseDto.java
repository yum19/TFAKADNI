package tn.esprit.backend.module6b.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoryAudioResponseDto {
    private Long storyId;
    private Boolean audioGenerated;
    private String audioUrl;
    private String voiceType;
    private String message;
}