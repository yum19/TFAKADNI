package tn.esprit.backend.service;

import tn.esprit.backend.entity.Commentaire;

import java.util.List;

public interface CommentaireService {
    Commentaire addCommentToPost(String email, Long postId, Commentaire commentaire);
    List<Commentaire> recupererTout();
    Commentaire recupererParId(Long id);
    Commentaire mettreAJour(String email, Long id, Commentaire commentaire);
    void supprimer(String email, Long id);
}