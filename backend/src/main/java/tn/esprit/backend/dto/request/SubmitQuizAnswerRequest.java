package tn.esprit.backend.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class SubmitQuizAnswerRequest {
    private Long questionId;

    // Used if QuestionType is SINGLE_CHOICE
    private Long selectedChoiceId;

    // Used if QuestionType is MULTIPLE_CHOICE
    private List<Long> selectedChoiceIds;

    // Used if QuestionType is OPEN_ENDED
    private String textAnswer;
}