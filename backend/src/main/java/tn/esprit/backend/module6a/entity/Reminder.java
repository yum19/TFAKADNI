package tn.esprit.backend.module6a.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reminders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "baby_id", nullable = false)
    private Baby baby;

    @Column(nullable = false, length = 30)
    private String type; // VACCINE / APPOINTMENT / GROWTH / CUSTOM

    @Column(nullable = false)
    private LocalDateTime reminderDate;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false, length = 20)
    private String status; // PENDING / SENT / DISMISSED

    @Column(nullable = false, length = 30)
    private String sourceType; // VACCINE / APPOINTMENT / MANUAL

    private Long sourceId; // id du vaccin ou du rendez-vous, null si MANUAL

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}