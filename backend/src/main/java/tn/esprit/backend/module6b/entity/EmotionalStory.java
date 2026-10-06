package tn.esprit.backend.module6b.entity;

import jakarta.persistence.*;
import lombok.*;
import tn.esprit.backend.entity.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "emotional_stories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmotionalStory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "mother_id", nullable = false)
    private User mother;

    @Column(nullable = false, length = 20)
    private String periodType; // WEEKLY / MONTHLY

    @Column(nullable = false, length = 30)
    private String tone; // SUPPORTIVE / CALM / ENCOURAGING

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String storyText;

    @Column(columnDefinition = "TEXT")
    private String highlights; // texte simple concaténé pour commencer

    @Column(length = 500)
    private String audioUrl; // null au début si pas encore généré

    @Column(length = 50)
    private String voiceType; // SOFT_FEMALE / CALM_NEUTRAL

    @Column(nullable = false)
    private Boolean audioGenerated;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}