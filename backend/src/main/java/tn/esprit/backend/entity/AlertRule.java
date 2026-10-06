package tn.esprit.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "alert_rules")
@Data
public class AlertRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Enumerated(EnumType.STRING)
    private AlertMetric metric;

    @Enumerated(EnumType.STRING)
    private AlertOperator operator;

    @Column(nullable = false)
    private Double threshold;

    @Enumerated(EnumType.STRING)
    private Alert.AlertSeverity severity = Alert.AlertSeverity.WARNING;

    @Column(name = "notif_method")
    private String notifMethod = "push";

    private Boolean active = true;

    private String label;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum AlertMetric {
        SYSTOLIC_BP, DIASTOLIC_BP, WEIGHT_KG,
        HEART_RATE, GLUCOSE_MMOL, TEMPERATURE_C, OXYGEN_PCT
    }

    public enum AlertOperator {
        GT, LT, GTE, LTE, EQ
    }
}