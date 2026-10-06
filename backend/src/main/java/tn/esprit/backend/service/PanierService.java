package tn.esprit.backend.service;

import tn.esprit.backend.entity.Panier;

import java.util.List;

public interface PanierService {
    Panier creer(String email, Panier panier);
    List<Panier> recupererParUser(String email);
    Panier recupererParId(String email, Long id);
    Panier mettreAJour(String email, Long id, Panier panier);
    void supprimer(String email, Long id);
}