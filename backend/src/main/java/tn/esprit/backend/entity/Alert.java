package tn.esprit.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
@Data
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "healthProfile", "sessions", "subscriptions", "invoices", "payments"})
    private User user;

    @ManyToOne
    @JoinColumn(name = "vital_id")
    @JsonIgnore
    private Vitals vital;

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type")
    private AlertType alertType;

    @Enumerated(EnumType.STRING)
    private AlertSeverity severity = AlertSeverity.WARNING;

    @Column(nullable = false)
    private String message;

    private String recommendation;

    @Column(name = "triggered_at")
    private LocalDateTime triggeredAt = LocalDateTime.now();

    @Column(name = "is_read")
    private Boolean isRead = false;

    @Column(name = "dismissed_at")
    private LocalDateTime dismissedAt;

    @Column(name = "notif_sent")
    private Boolean notifSent = false;

    public enum AlertType {
        HYPERTENSION, HYPOGLYCEMIA, WEIGHT,
        TACHYCARDIA, FEVER, OXYGEN, CUSTOM
    }

    public enum AlertSeverity {
        INFO, WARNING, DANGER, CRITICAL
    }
}