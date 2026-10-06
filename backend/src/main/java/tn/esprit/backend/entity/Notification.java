package tn.esprit.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotifType type;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", nullable = false, length = 500)
    private String message;

    @Column(name = "count")
    private Integer count;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    public enum NotifType {
        EXAM_DUE,       // 📋 Exam due this week
        ALERT_TRIGGERED, // 🔔 Alert-triggered exams
        VITALS_REMINDER  // 💊 Daily vitals reminder
    }
}