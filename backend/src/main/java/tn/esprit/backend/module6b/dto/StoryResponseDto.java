package tn.esprit.backend.module6b.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoryResponseDto {
    private Long id;
    private Long motherId;
    private String periodType;
    private String tone;
    private String title;
    private String storyText;
    private List<String> highlights;
    private Boolean audioGenerated;
    private String audioUrl;
    private String voiceType;
    private LocalDateTime createdAt;
}