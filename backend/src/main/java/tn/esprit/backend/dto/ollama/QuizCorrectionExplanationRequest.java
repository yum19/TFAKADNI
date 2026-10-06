package tn.esprit.backend.dto.ollama;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class QuizCorrectionExplanationRequest {

    @NotBlank
    private String question;

    @NotBlank
    private String correctAnswer;

    @NotBlank
    private String userAnswer;

    private String courseContext;
}
