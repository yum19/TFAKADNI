package tn.esprit.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class PlanConfigRequest {
    @NotBlank
    private String label;

    @NotBlank
    private String price;

    @NotBlank
    private String icon;

    private List<String> features;
}