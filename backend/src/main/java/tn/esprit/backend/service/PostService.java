package tn.esprit.backend.service;

import tn.esprit.backend.entity.Post;

import java.util.List;

public interface PostService {
    Post creer(String email, Post post);
    List<Post> recupererTout();
    Post recupererParId(Long id);
    Post mettreAJour(String email, Long id, Post post);
    void supprimer(String email, Long id);
}