package tn.esprit.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscriptions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Plan plan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    /** Null pour le plan FREE (illimité) */
    @Column(name = "end_date")
    private LocalDate endDate;

    /** ID Stripe (abonnés internationaux) */
    @Column(name = "stripe_sub_id", length = 255)
    private String stripeSubId;

    /** ID Konnect (abonnés tunisiens) */
    @Column(name = "konnect_sub_id", length = 255)
    private String konnectSubId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promo_code_id")
    private PromoCode promoCode;

    /** Montant réellement payé en TND (0 pour FREE, prix avec réduction si promo) */
    @Column(name = "amount_paid")
    private Double amountPaid;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt  = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum Plan   { FREE, PREMIUM, PRO }
    public enum Status { ACTIVE, CANCELLED, EXPIRED, PENDING }
}