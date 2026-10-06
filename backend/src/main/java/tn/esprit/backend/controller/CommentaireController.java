package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.entity.Commentaire;
import tn.esprit.backend.service.CommentaireService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CommentaireController {

    private final CommentaireService commentaireService;

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<Commentaire> addCommentToPost(Authentication authentication,
                                                        @PathVariable Long postId,
                                                        @RequestBody Commentaire commentaire) {
        return ResponseEntity.ok(
                commentaireService.addCommentToPost(authentication.getName(), postId, commentaire));
    }

    @GetMapping("/commentaires")
    public ResponseEntity<List<Commentaire>> recupererTout() {
        return ResponseEntity.ok(commentaireService.recupererTout());
    }

    @GetMapping("/commentaires/{id}")
    public ResponseEntity<Commentaire> recupererParId(@PathVariable Long id) {
        return ResponseEntity.ok(commentaireService.recupererParId(id));
    }

    @PutMapping("/commentaires/{id}")
    public ResponseEntity<Commentaire> mettreAJour(Authentication authentication,
                                                   @PathVariable Long id,
                                                   @RequestBody Commentaire commentaire) {
        return ResponseEntity.ok(
                commentaireService.mettreAJour(authentication.getName(), id, commentaire));
    }

    @DeleteMapping("/commentaires/{id}")
    public ResponseEntity<Void> supprimer(Authentication authentication,
                                          @PathVariable Long id) {
        commentaireService.supprimer(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}