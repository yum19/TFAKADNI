package tn.esprit.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PartnerGuideRequest {

    @NotBlank
    private String title;

    private String titleAr;

    @NotBlank
    private String content;

    @Min(1)
    @Max(45)
    private Integer targetWeek;

    private String category;
}

