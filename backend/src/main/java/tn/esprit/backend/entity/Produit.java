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
@Table(name = "produits")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "sessions", "subscriptions",
            "invoices", "payments", "healthProfile"})
    private User user;

    private String nom;
    private String description;
    private Double prix;
    private Integer stock;

    @ElementCollection
    @CollectionTable(name = "produit_images", joinColumns = @JoinColumn(name = "produit_id"))
    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    @OrderColumn(name = "image_order")
    private List<String> images = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categorie_id")
    @JsonIgnoreProperties({"produits", "parent", "hibernateLazyInitializer"})
    private Categorie categorie;

    @JsonIgnore
    @OneToMany(mappedBy = "produit", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PanierItem> panierItems = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "produit", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CommandeItem> commandeItems = new ArrayList<>();

    public void addImage(String imageUrl) {
        this.images.add(imageUrl);
    }
}