package tn.esprit.backend.service;

import tn.esprit.backend.entity.Produit;

import java.util.List;

public interface ProduitService {
    Produit creer(String email, Produit produit);
    List<Produit> recupererTout();
    Produit recupererParId(Long id);
    Produit mettreAJour(String email, Long id, Produit produit);
    void supprimer(String email, Long id);
}