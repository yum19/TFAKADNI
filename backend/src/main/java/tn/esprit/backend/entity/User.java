package tn.esprit.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@SQLRestriction("deleted_at IS NULL")   // soft-delete : exclut automatiquement les comptes supprimés
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // AJOUT
    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    /** Null si connexion OAuth (Google / Apple) */
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Provider provider = Provider.EMAIL;

    /** ID retourné par Google ou Apple */
    @Column(name = "provider_id", length = 255)
    private String providerId;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.USER;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Soft-delete RGPD — null = compte actif */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // ── Relations ─────────────────────────────────────────────────────────────

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private HealthProfile healthProfile;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Session> sessions;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Subscription> subscriptions;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Invoice> invoices;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Payment> payments;

    /** Code de parrainage unique de cet utilisateur */
    @Column(name = "referral_code", unique = true, length = 20)
    private String referralCode;

    /** URL de la photo de profil */
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt  = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ── Enums ─────────────────────────────────────────────────────────────────

    public enum Provider { EMAIL, GOOGLE, APPLE }

    public enum Role { USER, PARTNER, ADMIN }
}