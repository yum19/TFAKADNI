package tn.esprit.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "panier_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PanierItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "panier_id", nullable = false)
    @JsonBackReference("panier-items")
    private Panier panier;

    // Permet à Jackson de LIRE produit.id depuis le JSON entrant
    // mais ignore les champs cycliques à la sérialisation
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "produit_id", nullable = false)
    @JsonIgnoreProperties({"panierItems", "commandeItems", "hibernateLazyInitializer", "categorie"})
    private Produit produit;

    @Column(nullable = false)
    private Integer quantite = 1;

    public void setQuantite(Integer q) {
        this.quantite = (q != null && q > 0) ? q : 1;
    }
}