package tn.esprit.backend.module6a.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "baby_appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BabyAppointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "baby_id", nullable = false)
    private Baby baby;

    @Column(nullable = false)
    private LocalDateTime appointmentDate;

    @Column(nullable = false, length = 100)
    private String doctorName;

    @Column(nullable = false, length = 30)
    private String type; // PEDIATRE / VACCIN / CONTROLE / URGENCE / AUTRE

    @Column(length = 200)
    private String location;

    @Column(nullable = false, length = 20)
    private String status; // PLANNED / DONE / CANCELLED / MISSED

    private LocalDateTime reminderDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}