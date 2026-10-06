package tn.esprit.backend.module6a.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "baby_milestones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BabyMilestone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "baby_id", nullable = false)
    private Baby baby;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 30)
    private String category; // MOTOR / SOCIAL / LANGUAGE / COGNITIVE / OTHER

    @Column(nullable = false)
    private LocalDate milestoneDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 500)
    private String mediaUrl;

    @Column(length = 20)
    private String mediaType; // PHOTO / VIDEO / AUDIO

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}