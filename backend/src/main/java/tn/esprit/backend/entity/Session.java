package tn.esprit.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Hash SHA-256 du refresh token (jamais le token brut) */
    @Column(name = "token_hash", nullable = false, length = 512)
    private String tokenHash;

    /** User-Agent de l'appareil connecté */
    @Column(name = "device_info", length = 500)
    private String deviceInfo;

    @Column(length = 45)
    private String ip;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}