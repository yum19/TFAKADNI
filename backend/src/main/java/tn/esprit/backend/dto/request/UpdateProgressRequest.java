package tn.esprit.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateProgressRequest {

    private Long userId;

    @NotNull
    private Long courseId;

    @NotNull
    @Min(0)
    @Max(100)
    private Integer progressPct;
}
