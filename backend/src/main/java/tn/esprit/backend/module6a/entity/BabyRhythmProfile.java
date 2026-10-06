package tn.esprit.backend.module6a.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "baby_rhythm_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BabyRhythmProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "baby_id", nullable = false, unique = true)
    private Baby baby;

    private Integer averageFeedingIntervalMinutes;

    private Integer averageSleepDurationMinutes;

    private LocalTime usualMorningWakeTime;

    private LocalTime usualNapTime;

    private LocalTime usualBedtime;

    private Integer nightWakeFrequency;

    private Integer rhythmStabilityScore; // 0 -> 100

    @Column(nullable = false)
    private LocalDateTime lastCalculatedAt;

    @PrePersist
    public void onCreate() {
        if (this.lastCalculatedAt == null) {
            this.lastCalculatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.lastCalculatedAt = LocalDateTime.now();
    }
}