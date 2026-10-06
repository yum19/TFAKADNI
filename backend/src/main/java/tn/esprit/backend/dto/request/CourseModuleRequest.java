package tn.esprit.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CourseModuleRequest {

    @NotNull
    private Long courseId;

    @NotBlank
    private String title;

    @NotBlank
    private String contentType;

    private String contentUrl;

    private String contentText;

    @NotNull
    @Min(1)
    private Integer orderIndex;

    @NotNull
    @Min(1)
    private Integer durationMin;
}

