package tn.esprit.backend.module6b.entity;

import tn.esprit.backend.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "mood_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MoodLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "mother_id", nullable = false)
    private User mother;

    @Column(nullable = false)
    private LocalDate logDate;

    @Column(nullable = false)
    private Integer moodScore;

    @Column(nullable = false, length = 20)
    private String emotionType;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private Boolean isShared;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}