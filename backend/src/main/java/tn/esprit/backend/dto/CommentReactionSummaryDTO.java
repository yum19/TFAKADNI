// src/main/java/tn/esprit/backend/dto/CommentReactionSummaryDTO.java
package tn.esprit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.backend.entity.ReactionType;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentReactionSummaryDTO {
    private Map<ReactionType, Long> counts;
    private ReactionType myReaction;  // null = no reaction by this session
    private long total;
}