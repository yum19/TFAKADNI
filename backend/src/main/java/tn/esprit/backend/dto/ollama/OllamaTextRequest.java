package tn.esprit.backend.dto.ollama;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OllamaTextRequest {
    @NotBlank
    private String text;
}
