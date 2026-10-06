package tn.esprit.backend.module6b.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoryRequestDto {
    private String periodType; // WEEKLY par défaut
    private String tone;       // SUPPORTIVE par défaut
    private String voiceType;  // SOFT_FEMALE par défaut
}