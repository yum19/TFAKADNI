package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChoiceResponse {
    private Long id;
    private String choiceText;
    private Integer choiceOrder;
    private Boolean correct;
}
