package tn.esprit.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class QuizRequest {

    @NotNull
    private Long courseModuleId;

    @NotNull
    @Min(0)
    @Max(100)
    private Integer passScore;

    @Valid
    @NotEmpty
    private List<QuestionRequest> questions;
}