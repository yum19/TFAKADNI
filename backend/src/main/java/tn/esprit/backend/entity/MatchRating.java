package tn.esprit.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "match_ratings",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"match_id", "rater_id"},
                name = "uq_match_rating"
        )
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MatchRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The mutual match this rating belongs to */
    @Column(name = "match_id", nullable = false)
    private Long matchId;

    /** User who is giving the rating */
    @Column(name = "rater_id", nullable = false)
    private Long raterId;

    /** User who is being rated */
    @Column(name = "rated_id", nullable = false)
    private Long ratedId;

    /** 1–5 stars */
    @Column(nullable = false)
    private Integer stars;

    /** Optional comment */
    @Column(length = 500)
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}