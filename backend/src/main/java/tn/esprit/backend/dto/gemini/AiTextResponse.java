package tn.esprit.backend.dto.gemini;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiTextResponse {
    private String feature;
    private String model;
    private String result;
}
