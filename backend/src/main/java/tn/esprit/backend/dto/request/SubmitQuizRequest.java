package tn.esprit.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class SubmitQuizRequest {

    private Long userId;

    @NotNull
    private Long quizId;

    /* @NotBlank
    private String answersJson; */

    @Valid
    @NotEmpty
    private List<SubmitQuizAnswerRequest> answers;

}
