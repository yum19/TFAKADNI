package tn.esprit.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DynamicCareTask {
    private String title;
    private String description;
    private String category; // PHYSICAL, EMOTIONAL, CHORE, MEDICAL
    private double baseHealingScore; // AI-assigned base value (1.0 to 10.0)
}