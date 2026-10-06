package tn.esprit.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChoiceRequest {

    @NotBlank
    private String choiceText;

    private Integer choiceOrder;

    @NotNull
    private Boolean correct;
}
