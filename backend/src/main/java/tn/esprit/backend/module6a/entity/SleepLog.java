package tn.esprit.backend.module6a.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Duration;
import java.time.LocalDateTime;

@Entity
@Table(name = "sleep_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SleepLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "baby_id", nullable = false)
    private Baby baby;

    @Column(nullable = false)
    private LocalDateTime sleepStart;

    private LocalDateTime sleepEnd;

    private Integer duration; // en minutes, calculée automatiquement

    @Column(length = 20)
    private String quality; // GOOD / RESTLESS / INTERRUPTED

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        calculateDuration();
    }

    @PreUpdate
    public void onUpdate() {
        calculateDuration();
    }

    public void calculateDuration() {
        if (sleepStart != null && sleepEnd != null && sleepEnd.isAfter(sleepStart)) {
            this.duration = (int) Duration.between(sleepStart, sleepEnd).toMinutes();
        } else {
            this.duration = null;
        }
    }
}