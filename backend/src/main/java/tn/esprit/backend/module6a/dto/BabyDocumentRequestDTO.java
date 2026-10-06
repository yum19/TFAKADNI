package tn.esprit.backend.module6a.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BabyDocumentRequestDTO {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Document type is required")
    private String documentType;

    @NotBlank(message = "File URL is required")
    private String fileUrl;

    @PositiveOrZero(message = "File size cannot be negative")
    private Long fileSize;

    private String notes;
}