package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class QuizAttemptAnswerResponse {
    private Long id;
    private Long questionId;

    // Existing SINGLE_CHOICE field
    private ChoiceResponse selectedChoice;

    // NEW: MULTIPLE_CHOICE field
    private List<ChoiceResponse> selectedChoices;

    // NEW: OPEN_ENDED fields
    private String openEndedAnswer;
    private String aiFeedback;

    private Boolean correct;
}
