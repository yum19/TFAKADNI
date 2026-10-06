package tn.esprit.backend.service;

import tn.esprit.backend.dto.CommentReactionSummaryDTO;
import tn.esprit.backend.entity.ReactionType;

public interface CommentReactionService {
    CommentReactionSummaryDTO react(Long commentaireId, String email, ReactionType type);
    CommentReactionSummaryDTO getSummary(Long commentaireId, String email);
}