package tn.esprit.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class QuestionRequest {

    @NotBlank
    private String questionText;

    private Integer questionOrder;

    private String questionType = "SINGLE_CHOICE";

    @Valid
    @NotEmpty
    private List<ChoiceRequest> choices;
}
