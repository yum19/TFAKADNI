package tn.esprit.backend.dto.ollama;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PartnerTipsRequest {

    @Min(1)
    @Max(45)
    private Integer pregnancyWeek;

    @NotBlank
    private String situation;
}
