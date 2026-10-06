package tn.esprit.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "vitals")
@Data
public class Vitals {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    // @JsonIgnore
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "healthProfile", "sessions", "subscriptions", "invoices", "payments"})
    private User user;

    @ManyToOne
    @JoinColumn(name = "pregnancy_id", nullable = false)
    @JsonIgnoreProperties({"vitals", "prenatalExams"})
    private Pregnancy pregnancy;

    @Column(name = "measured_at")
    private LocalDateTime measuredAt = LocalDateTime.now();

    @Column(name = "systolic_bp")
    private Integer systolicBp;

    @Column(name = "diastolic_bp")
    private Integer diastolicBp;

    @Column(name = "weight_kg")
    private Double weightKg;

    @Column(name = "heart_rate")
    private Integer heartRate;

    @Column(name = "glucose_mmol")
    private Double glucoseMmol;

    @Column(name = "temperature_c")
    private Double temperatureC;

    @Column(name = "oxygen_pct")
    private Integer oxygenPct;

    private String notes;

    @Column(name = "is_shared_doctor")
    private Boolean isSharedDoctor = false;

    @Enumerated(EnumType.STRING)
    private VitalSource source = VitalSource.MANUAL;

    public enum VitalSource {
        MANUAL, DEVICE, IMPORT
    }

    @Column(name = "ml_risk_level")
    private String mlRiskLevel;

    @Column(name = "ml_risk_score")
    private Integer mlRiskScore;
}