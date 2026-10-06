// tn/esprit/backend/entity/Commande.java
package tn.esprit.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "commandes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Commande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String nom;
    private String prenom;
    private String mail;
    private String adresse;
    private String telephone;          // ← added
    private Double total;
    private LocalDateTime date;

    @Column(name = "stripe_session_id")
    private String stripeSessionId;

    @Column(name = "stripe_payment_intent_id")
    private String stripePaymentIntentId;  // ← added

    /** PENDING → PAID → FAILED */
    @Column(nullable = false, length = 20)
    private String statut = "PENDING";

    @OneToMany(mappedBy = "commande",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY)
    private List<CommandeItem> items = new ArrayList<>();
}