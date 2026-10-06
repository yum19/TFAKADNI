package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.CommentReaction;
import tn.esprit.backend.entity.ReactionType;

import java.util.Optional;

public interface CommentReactionRepository extends JpaRepository<CommentReaction, Long> {
    Optional<CommentReaction> findByCommentaireIdAndUserId(Long commentaireId, Long userId);
    long countByCommentaireIdAndType(Long commentaireId, ReactionType type);
}