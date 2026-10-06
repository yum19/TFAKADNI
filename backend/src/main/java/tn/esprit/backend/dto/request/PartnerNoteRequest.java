package tn.esprit.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PartnerNoteRequest {

    private Long authorId;

    @NotNull
    private Long recipientId;

    @NotNull
    private Long pregnancyId;

    @NotBlank
    private String content;

}

