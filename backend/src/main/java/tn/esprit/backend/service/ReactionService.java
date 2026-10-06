package tn.esprit.backend.service;

import tn.esprit.backend.dto.ReactionSummaryDTO;
import tn.esprit.backend.entity.ReactionType;

public interface ReactionService {
    ReactionSummaryDTO react(Long postId, String email, ReactionType type);
    ReactionSummaryDTO getSummary(Long postId, String email);
}