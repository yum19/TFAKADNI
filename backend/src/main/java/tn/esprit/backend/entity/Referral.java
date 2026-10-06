package tn.esprit.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "referrals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Referral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** L'utilisateur qui a parrainé */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referrer_id", nullable = false)
    private User referrer;

    /** L'utilisateur parrainé */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referred_id", nullable = false)
    private User referred;

    /** Code utilisé lors de l'inscription */
    @Column(name = "referral_code", nullable = false, length = 20)
    private String referralCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "rewarded_at")
    private LocalDateTime rewardedAt;

    public enum Status {
        PENDING,    // inscrit mais pas encore payé
        REWARDED,   // récompense accordée
        EXPIRED     // expiré sans paiement
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}