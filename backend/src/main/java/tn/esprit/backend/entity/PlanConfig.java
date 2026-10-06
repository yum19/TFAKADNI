package tn.esprit.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "plan_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanConfig {

    @Id
    @Column(nullable = false, length = 20)
    private String planKey; // FREE, PREMIUM, PRO

    @Column(nullable = false, length = 100)
    private String label;

    @Column(nullable = false, length = 50)
    private String price;

    @Column(nullable = false, length = 50)
    private String icon;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String featuresJson; // JSON array ex: ["Feature 1","Feature 2"]
}