// src/main/java/tn/esprit/backend/entity/Match.java
package tn.esprit.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "mentorship_matches")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The user who received the match suggestion (the "mother" who triggered AI) */
    @Column(name = "user_a_id", nullable = false)
    private Long userAId;

    /** The suggested marraine */
    @Column(name = "user_b_id", nullable = false)
    private Long userBId;

    @Column(name = "ai_score")
    private Double aiScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_a", nullable = false)
    @Builder.Default
    private MatchStatus statusA = MatchStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_b", nullable = false)
    @Builder.Default
    private MatchStatus statusB = MatchStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum MatchStatus { PENDING, ACCEPTED, REJECTED }
}