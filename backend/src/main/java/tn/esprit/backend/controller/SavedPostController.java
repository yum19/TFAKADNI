package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.SavedPostResponseDTO;
import tn.esprit.backend.service.SavedPostService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/saved-posts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SavedPostController {

    private final SavedPostService savedPostService;

    /**
     * POST /api/saved-posts/{postId}/toggle
     * Toggle save/unsave for the authenticated user.
     * Returns: { "saved": true|false, "count": <long> }
     */
    @PostMapping("/{postId}/toggle")
    public ResponseEntity<Map<String, Object>> toggle(
            Authentication authentication,
            @PathVariable Long postId) {

        boolean saved = savedPostService.toggleSave(authentication.getName(), postId);
        long count    = savedPostService.countSaved(authentication.getName());

        return ResponseEntity.ok(Map.of("saved", saved, "count", count));
    }

    /**
     * GET /api/saved-posts/status/{postId}
     * Check whether the authenticated user has saved a specific post.
     * Returns: { "saved": true|false }
     */
    @GetMapping("/status/{postId}")
    public ResponseEntity<Map<String, Boolean>> status(
            Authentication authentication,
            @PathVariable Long postId) {

        boolean saved = savedPostService.isSaved(authentication.getName(), postId);
        return ResponseEntity.ok(Map.of("saved", saved));
    }

    /**
     * GET /api/saved-posts
     * Returns the authenticated user's saved posts, newest first.
     */
    @GetMapping
    public ResponseEntity<List<SavedPostResponseDTO>> getSaved(Authentication authentication) {
        return ResponseEntity.ok(savedPostService.getSavedPosts(authentication.getName()));
    }

    /**
     * GET /api/saved-posts/count
     * Returns the count of saved posts for the authenticated user.
     * Returns: { "count": <long> }
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> count(Authentication authentication) {
        long count = savedPostService.countSaved(authentication.getName());
        return ResponseEntity.ok(Map.of("count", count));
    }
}