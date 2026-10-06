package tn.esprit.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "promo_codes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PromoCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /** Pourcentage de réduction : 0-100 */
    @Column(name = "discount_pct", nullable = false)
    private Integer discountPct;

    /** Null = utilisations illimitées */
    @Column(name = "max_uses")
    private Integer maxUses;

    @Column(name = "used_count", nullable = false)
    private Integer usedCount = 0;

    /** Null = pas d'expiration */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    /** Vérifie si le code est encore utilisable */
    public boolean isUsable() {
        if (!active) return false;
        if (expiresAt != null && LocalDateTime.now().isAfter(expiresAt)) return false;
        if (maxUses != null && usedCount >= maxUses) return false;
        return true;
    }
}