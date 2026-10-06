package tn.esprit.backend.module6a.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "vaccines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vaccine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "baby_id", nullable = false)
    private Baby baby;

    @Column(nullable = false, length = 100)
    private String vaccineName;

    @Column(nullable = false)
    private LocalDate scheduledDate;

    private LocalDate takenDate;

    @Column(nullable = false, length = 20)
    private String status; // SCHEDULED / DONE / MISSED / CANCELLED

    private LocalDate reminderDate;

    @Column(length = 50)
    private String batchNumber;

    @Column(length = 100)
    private String administeredBy;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}