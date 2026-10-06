package tn.esprit.backend.module6a.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "feedings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feeding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "baby_id", nullable = false)
    private Baby baby;

    @Column(nullable = false)
    private LocalDate feedingDate;

    @Column(nullable = false)
    private LocalTime feedingTime;

    @Column(nullable = false, length = 20)
    private String feedingMode; // breastfeeding / bottle / pumped_milk / mixed

    private Double quantity; // en ml

    private Integer duration; // en minutes

    @Column(length = 10)
    private String sideUsed; // LEFT / RIGHT / BOTH / NONE

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}