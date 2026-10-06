package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class QuizAttemptResponse {
    private Long id;
    private Long quizId;
    private Integer score;
    private Boolean passed;
    private LocalDateTime takenAt;
    private List<QuizAttemptAnswerResponse> answers;
}
