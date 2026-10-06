package tn.esprit.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class VitalsMLRequest {

    // Required — matches vitalForm required fields
    @JsonProperty("systolic_bp")
    private Integer systolicBp;

    @JsonProperty("diastolic_bp")
    private Integer diastolicBp;

    @JsonProperty("heart_rate")
    private Integer heartRate;

    @JsonProperty("weight_kg")
    private Double weightKg;

    @JsonProperty("pregnancy_week")
    private Integer pregnancyWeek;

    // Optional — Flask will apply medical defaults if null/missing
    @JsonProperty("oxygen_pct")
    private Integer oxygenPct;

    @JsonProperty("glucose_mmol")
    private Double glucoseMmol;

    @JsonProperty("temperature_c")
    private Double temperatureC;
}
