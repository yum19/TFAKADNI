package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.dto.ReactionSummaryDTO;
import tn.esprit.backend.entity.Post;
import tn.esprit.backend.entity.Reaction;
import tn.esprit.backend.entity.ReactionType;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.PostRepository;
import tn.esprit.backend.repository.ReactionRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.ReactionService;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReactionServiceImpl implements ReactionService {

    private final ReactionRepository reactionRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ReactionSummaryDTO react(Long postId, String email, ReactionType type) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found: " + postId));
        User user = getUserByEmail(email);

        Optional<Reaction> existing = reactionRepository.findByPostIdAndUserId(postId, user.getId());

        if (existing.isPresent()) {
            Reaction r = existing.get();
            if (r.getType() == type) {
                reactionRepository.delete(r);
            } else {
                r.setType(type);
                reactionRepository.save(r);
            }
        } else {
            Reaction r = new Reaction();
            r.setPost(post);
            r.setUser(user);
            r.setType(type);
            reactionRepository.save(r);
        }
        return buildSummary(postId, user.getId());
    }

    @Override
    public ReactionSummaryDTO getSummary(Long postId, String email) {
        if (!postRepository.existsById(postId))
            throw new RuntimeException("Post not found: " + postId);
        User user = getUserByEmail(email);
        return buildSummary(postId, user.getId());
    }

    private ReactionSummaryDTO buildSummary(Long postId, Long userId) {
        Map<ReactionType, Long> counts = new LinkedHashMap<>();
        long total = 0;
        for (ReactionType t : ReactionType.values()) {
            long c = reactionRepository.countByPostIdAndType(postId, t);
            counts.put(t, c);
            total += c;
        }
        ReactionType myReaction = reactionRepository
                .findByPostIdAndUserId(postId, userId)
                .map(Reaction::getType)
                .orElse(null);
        return new ReactionSummaryDTO(counts, myReaction, total);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }
}