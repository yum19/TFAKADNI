package tn.esprit.backend.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "stories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Story {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "sessions", "subscriptions", "invoices", "payments", "healthProfile"})
    private User user;

    @Column(columnDefinition = "TEXT")
    private String contenu;

    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private StoryType type;

    @Column(name = "created_at", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime expiresAt;

    public static final long STORY_DURATION_MINUTES = 1;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.expiresAt = this.createdAt.plusMinutes(STORY_DURATION_MINUTES);
    }

    public enum StoryType { TEXT, PHOTO }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiresAt);
    }
}