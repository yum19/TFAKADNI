package tn.esprit.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Categorie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;

    // ==================== RELATION PARENT (sous-catégories) ====================
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @JsonIgnoreProperties({"produits", "parent"})
    private Categorie parent;

    // ==================== RELATION AVEC PRODUITS (Bidirectional) ====================
    @OneToMany(mappedBy = "categorie", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Produit> produits = new ArrayList<>();

    // Méthodes utilitaires
    public void addProduit(Produit produit) {
        produits.add(produit);
        produit.setCategorie(this);
    }

    public void removeProduit(Produit produit) {
        produits.remove(produit);
        produit.setCategorie(null);
    }
}