package tn.esprit.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class PlanConfigResponse {
    private String planKey;
    private String label;
    private String price;
    private String icon;
    private List<String> features;
}