package tn.esprit.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;


@Data
public class UpdateCourseModuleRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String contentType;

    private String contentUrl;

    private String contentText;

    @Min(1)
    private Integer orderIndex;

    @Min(1)
    private Integer durationMin;

}

