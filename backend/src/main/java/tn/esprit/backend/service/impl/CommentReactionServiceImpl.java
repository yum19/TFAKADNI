package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.dto.CommentReactionSummaryDTO;
import tn.esprit.backend.entity.CommentReaction;
import tn.esprit.backend.entity.Commentaire;
import tn.esprit.backend.entity.ReactionType;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.CommentReactionRepository;
import tn.esprit.backend.repository.CommentaireRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.CommentReactionService;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CommentReactionServiceImpl implements CommentReactionService {

    private final CommentReactionRepository commentReactionRepository;
    private final CommentaireRepository commentaireRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CommentReactionSummaryDTO react(Long commentaireId, String email, ReactionType type) {
        Commentaire commentaire = commentaireRepository.findById(commentaireId)
                .orElseThrow(() -> new RuntimeException("Comment not found: " + commentaireId));
        User user = getUserByEmail(email);

        Optional<CommentReaction> existing =
                commentReactionRepository.findByCommentaireIdAndUserId(commentaireId, user.getId());

        if (existing.isPresent()) {
            CommentReaction r = existing.get();
            if (r.getType() == type) {
                commentReactionRepository.delete(r);
            } else {
                r.setType(type);
                commentReactionRepository.save(r);
            }
        } else {
            CommentReaction r = new CommentReaction();
            r.setCommentaire(commentaire);
            r.setUser(user);
            r.setType(type);
            commentReactionRepository.save(r);
        }
        return buildSummary(commentaireId, user.getId());
    }

    @Override
    public CommentReactionSummaryDTO getSummary(Long commentaireId, String email) {
        if (!commentaireRepository.existsById(commentaireId))
            throw new RuntimeException("Comment not found: " + commentaireId);
        User user = getUserByEmail(email);
        return buildSummary(commentaireId, user.getId());
    }

    private CommentReactionSummaryDTO buildSummary(Long commentaireId, Long userId) {
        Map<ReactionType, Long> counts = new LinkedHashMap<>();
        long total = 0;
        for (ReactionType t : ReactionType.values()) {
            long c = commentReactionRepository.countByCommentaireIdAndType(commentaireId, t);
            counts.put(t, c);
            total += c;
        }
        ReactionType myReaction = commentReactionRepository
                .findByCommentaireIdAndUserId(commentaireId, userId)
                .map(CommentReaction::getType)
                .orElse(null);
        return new CommentReactionSummaryDTO(counts, myReaction, total);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }
}