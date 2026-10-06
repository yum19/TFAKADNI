package tn.esprit.backend.module6a.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "baby_insights")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BabyInsight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "baby_id", nullable = false)
    private Baby baby;

    @Column(nullable = false, length = 20)
    private String insightType; // INFO / ATTENTION / TREND / REMINDER / RECOMMENDATION

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 10)
    private String priority; // LOW / MEDIUM / HIGH

    @Column(nullable = false, length = 30)
    private String sourceModule; // SLEEP / GROWTH / VACCINE / REMINDER / FEEDING

    @Column(nullable = false)
    private LocalDateTime generatedAt;

    @Column(nullable = false)
    private Boolean isRead;

    @Column(nullable = false, length = 20)
    private String status; // ACTIVE / DISMISSED / RESOLVED

    @Column(length = 100)
    private String actionLabel;

    @Column(length = 500)
    private String actionUrl;

    @Column
    private Double confidenceScore;

    @Column(length = 30)
    private String generatedBy; // RULE_ENGINE / AI_NARRATOR / ML_ENGINE

    @Column(length = 60)
    private String ruleCode; // ex: SLEEP_AVG_LOW_3D

    @Column(length = 500)
    private String reason; // explication métier courte

    @Column(length = 1000)
    private String evidenceSummary; // résumé des données utilisées

    @Column
    private LocalDateTime readAt;

    @Column
    private LocalDateTime dismissedAt;

    @Column
    private LocalDateTime resolvedAt;

    @PrePersist
    public void onCreate() {
        if (this.generatedAt == null) {
            this.generatedAt = LocalDateTime.now();
        }
        if (this.isRead == null) {
            this.isRead = false;
        }
        if (this.status == null) {
            this.status = "ACTIVE";
        }
        if (this.generatedBy == null) {
            this.generatedBy = "RULE_ENGINE";
        }
    }
}