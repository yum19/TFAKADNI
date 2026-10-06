package tn.esprit.backend.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Sent to the Angular frontend so it can display warnings / blur logic.
 */
@Data
@Builder
public class PostAnalysisDTO {

    private Long    postId;
    private Boolean isHarmful;
    private String  severity;           // NONE / LOW / MEDIUM / HIGH
    private String  category;
    private String  categoryLabel;
    private Double  confidence;

    /** Shown only to the post's author */
    private String  warningMessage;

    /** Shown to other users when shouldBlur is true */
    private String  blurMessage;

    /** Whether the post content should be blurred for non-authors */
    private Boolean shouldBlur;

    /** Whether the author has acknowledged the warning */
    private Boolean authorAcknowledged;
}