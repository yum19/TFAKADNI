package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class QuizResponse {
    private Long id;
    private Long courseModuleId;
    private Integer passScore;
    private List<QuestionResponse> questions;
}
