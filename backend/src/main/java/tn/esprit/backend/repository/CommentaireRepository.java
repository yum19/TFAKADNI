package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.Commentaire;

import java.util.Optional;

public interface CommentaireRepository extends JpaRepository<Commentaire, Long> {
    Optional<Commentaire> findByIdAndUserId(Long id, Long userId);
}