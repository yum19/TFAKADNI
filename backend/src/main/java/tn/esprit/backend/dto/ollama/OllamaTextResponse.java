package tn.esprit.backend.dto.ollama;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OllamaTextResponse {

    private String feature;
    private String model;
    private String result;
}
