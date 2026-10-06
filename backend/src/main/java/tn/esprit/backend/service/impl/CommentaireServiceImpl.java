package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.backend.entity.Commentaire;
import tn.esprit.backend.entity.Post;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.CommentaireRepository;
import tn.esprit.backend.repository.PostRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.CommentaireService;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentaireServiceImpl implements CommentaireService {

    private final CommentaireRepository commentaireRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Override
    public Commentaire addCommentToPost(String email, Long postId, Commentaire commentaire) {
        User user = getUserByEmail(email);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post non trouvé avec l'id : " + postId));

        if (commentaire.getDate() == null) commentaire.setDate(LocalDateTime.now());
        if (commentaire.getAnonyme() == null) commentaire.setAnonyme(false);

        commentaire.setUser(user);
        commentaire.setPost(post);
        post.getCommentaires().add(commentaire);
        return commentaireRepository.save(commentaire);
    }

    @Override
    public List<Commentaire> recupererTout() {
        return commentaireRepository.findAll();
    }

    @Override
    public Commentaire recupererParId(Long id) {
        return commentaireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commentaire non trouvé avec l'id : " + id));
    }

    @Override
    public Commentaire mettreAJour(String email, Long id, Commentaire commentaire) {
        User user = getUserByEmail(email);
        Commentaire existant = commentaireRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Commentaire non trouvé ou accès refusé"));
        existant.setContenu(commentaire.getContenu());
        existant.setAnonyme(commentaire.getAnonyme());
        return commentaireRepository.save(existant);
    }

    @Override
    public void supprimer(String email, Long id) {
        User user = getUserByEmail(email);
        Commentaire existant = commentaireRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Commentaire non trouvé ou accès refusé"));
        commentaireRepository.delete(existant);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }
}