package tn.esprit.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * Mirrors the JSON returned by the Flask /detect-harmful endpoint.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class HarmfulAnalysisResponse {

    private Long    postId;
    private Boolean isHarmful;
    private String  severity;       // NONE / LOW / MEDIUM / HIGH
    private String  category;       // SAFE / BLEEDING / SEVERE_PAIN / …
    private String  categoryLabel;
    private Double  confidence;
    private String  warningMessage;
    private String  blurMessage;
    private Boolean shouldBlur;
}