package tn.esprit.backend.service.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.backend.dto.SavedPostResponseDTO;
import tn.esprit.backend.entity.Post;
import tn.esprit.backend.entity.SavedPost;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.PostRepository;
import tn.esprit.backend.repository.SavedPostRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.SavedPostService;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavedPostServiceImpl implements SavedPostService {

    private final SavedPostRepository savedPostRepository;
    private final PostRepository      postRepository;
    private final UserRepository      userRepository;

    // ── helpers ──────────────────────────────────────────────────────────────

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private Post requirePost(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + postId));
    }

    // ── public API ───────────────────────────────────────────────────────────

    @Override
    @Transactional
    public boolean toggleSave(String email, Long postId) {
        User user = requireUser(email);
        Post post = requirePost(postId);

        Optional<SavedPost> existing =
                savedPostRepository.findByUserIdAndPostId(user.getId(), postId);

        if (existing.isPresent()) {
            savedPostRepository.delete(existing.get());
            return false; // now unsaved
        } else {
            savedPostRepository.save(
                    SavedPost.builder()
                            .user(user)
                            .post(post)
                            .build()
            );
            return true; // now saved
        }
    }

    @Override
    public boolean isSaved(String email, Long postId) {
        User user = requireUser(email);
        return savedPostRepository.existsByUserIdAndPostId(user.getId(), postId);
    }

    @Override
    public List<SavedPostResponseDTO> getSavedPosts(String email) {
        User user = requireUser(email);

        List<SavedPost> savedPosts = savedPostRepository
                .findByUserIdOrderBySavedAtDesc(user.getId());

        return savedPosts.stream()
                .map(SavedPostResponseDTO::from)
                .collect(Collectors.toList());
    }

    @Override
    public long countSaved(String email) {
        User user = requireUser(email);
        return savedPostRepository.countByUserId(user.getId());
    }
}