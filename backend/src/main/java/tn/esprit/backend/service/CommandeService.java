package tn.esprit.backend.service;

import tn.esprit.backend.entity.Commande;

import java.util.List;

public interface CommandeService {
    Commande creer(String email, Commande commande);
    List<Commande> recupererParUser(String email);
    Commande recupererParId(String email, Long id);
    Commande mettreAJour(String email, Long id, Commande commande);
    void supprimer(String email, Long id);
}