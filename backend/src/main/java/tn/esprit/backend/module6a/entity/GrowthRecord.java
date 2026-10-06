package tn.esprit.backend.module6a.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "growth_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrowthRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "baby_id", nullable = false)
    private Baby baby;

    @Column(nullable = false)
    private LocalDate recordDate;

    @Column(nullable = false)
    private Double weight; // kg

    @Column(nullable = false)
    private Double height; // cm

    private Double headCircumference; // cm

    private Double bmi; // calculé automatiquement

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        calculateBmi();
    }

    @PreUpdate
    public void onUpdate() {
        calculateBmi();
    }

    public void calculateBmi() {
        if (weight != null && height != null && height > 0) {
            double heightInMeters = height / 100.0;
            this.bmi = weight / (heightInMeters * heightInMeters);
        } else {
            this.bmi = null;
        }
    }
}