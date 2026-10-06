package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class QuestionResponse {
    private Long id;
    private String questionText;
    private Integer questionOrder;
    private String questionType;
    private List<ChoiceResponse> choices;
}
