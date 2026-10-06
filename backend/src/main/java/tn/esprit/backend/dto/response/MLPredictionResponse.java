package tn.esprit.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class MLPredictionResponse {

    @JsonProperty("risk_level")
    private String riskLevel;           // Low / Moderate / High / Critical

    @JsonProperty("risk_score")
    private Integer riskScore;          // 0–100

    @JsonProperty("confidence")
    private Double confidence;          // 0.0–1.0

    @JsonProperty("factors")
    private List<String> factors;       // contributing risk factors

    @JsonProperty("recommendation")
    private String recommendation;

    @JsonProperty("week_context")
    private String weekContext;

    @JsonProperty("used_defaults")
    private List<String> usedDefaults;  // which optional fields were estimated

    @JsonProperty("individual_status")
    private Map<String, String> individualStatus;
}
