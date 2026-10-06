package tn.esprit.backend.service;

import tn.esprit.backend.entity.Categorie;

import java.util.List;

public interface CategorieService {
    Categorie creer(Categorie categorie);
    List<Categorie> recupererTout();
    Categorie recupererParId(Long id);
    Categorie mettreAJour(Long id, Categorie categorie);
    void supprimer(Long id);
}