package tn.esprit.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Stores the harmful-content analysis result for each post.
 * One row per post, updated whenever the post content changes.
 */
@Entity
@Table(name = "post_analysis")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The post that was analysed */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false, unique = true)
    private Post post;

    /** Is the content considered harmful? */
    @Column(nullable = false)
    private Boolean isHarmful = false;

    /**
     * Severity level: NONE, LOW, MEDIUM, HIGH
     */
    @Column(length = 20)
    private String severity = "NONE";

    /**
     * Category from the ML model:
     * SAFE, MISCARRIAGE, BLEEDING, SEVERE_PAIN, BABY_LOSS,
     * PREECLAMPSIA, PRETERM_LABOR, ECTOPIC, STILLBIRTH,
     * POSTPARTUM_CRISIS, SELF_HARM, SUBSTANCE_ABUSE, MEDICAL_EMERGENCY
     */
    @Column(length = 50)
    private String category = "SAFE";

    /** Human-readable label for the category */
    @Column(length = 100)
    private String categoryLabel;

    /** ML confidence score 0-100 */
    @Column
    private Double confidence;

    /**
     * Warning message shown only to the post AUTHOR.
     * Tells them to seek medical help if needed.
     */
    @Column(columnDefinition = "TEXT")
    private String warningMessage;

    /**
     * Message shown to OTHER users instead of the blurred post content.
     */
    @Column(columnDefinition = "TEXT")
    private String blurMessage;

    /**
     * Whether the post should be blurred for other users.
     * Author always sees the full post.
     */
    @Column(nullable = false)
    private Boolean shouldBlur = false;

    /**
     * Whether the author has acknowledged / dismissed the warning.
     */
    @Column(nullable = false)
    private Boolean authorAcknowledged = false;

    @Column(name = "analysed_at")
    private LocalDateTime analysedAt;

    @PrePersist
    protected void onCreate() {
        analysedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        analysedAt = LocalDateTime.now();
    }
}