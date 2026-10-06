// src/main/java/tn/esprit/backend/dto/ReactionSummaryDTO.java
package tn.esprit.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.backend.entity.ReactionType;

import java.util.Map;

/**
 * Sent back to Angular after every react/un-react action.
 * Contains the updated counts per type and what THIS session chose.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReactionSummaryDTO {

    /** Total counts per ReactionType for this post */
    private Map<ReactionType, Long> counts;

    /** The ReactionType the current session has chosen, or null if none */
    private ReactionType myReaction;

    /** Total reactions across all types */
    private long total;
}