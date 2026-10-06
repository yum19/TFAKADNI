package tn.esprit.backend.module6b.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "support_resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 30)
    private String type; // ARTICLE / AUDIO / VIDEO / HOTLINE

    @Column(nullable = false, length = 50)
    private String category; // Anxiety / Baby blues / Depression / General

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 1000)
    private String url;

    @Column(columnDefinition = "TEXT")
    private String contentText; // for ARTICLE full content or rich text/plain text

    @Column(length = 30)
    private String phoneNumber; // for HOTLINE

    @Column(length = 1000)
    private String thumbnailUrl; // preview image for cards

    @Column(length = 20)
    private String displayMode; // MEDIA / TEXT / PHONE / LINK

    private Integer estimatedMinutes;

    @Column(nullable = false)
    private Boolean isRecommended;

    @Column(nullable = false, length = 10)
    private String language; // fr / ar / en

    @Column(nullable = false, length = 20)
    private String riskLevelTarget; // Low / Moderate / High / All

    @Column(nullable = false)
    private Boolean isActive;
}