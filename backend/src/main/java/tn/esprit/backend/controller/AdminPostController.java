package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.entity.Post;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.PostRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.PostService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin-only community endpoints.
 * Accessible only to users with ROLE_ADMIN.
 *
 * Base path: /api/admin/posts
 */
@RestController
@RequestMapping("/api/admin/posts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPostController {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final PostService    postService;

    /**
     * GET /api/admin/posts
     * Return all posts (same as regular but protected for admin use).
     */
    @GetMapping
    public ResponseEntity<List<Post>> getAllPosts() {
        return ResponseEntity.ok(postService.recupererTout());
    }

    /**
     * DELETE /api/admin/posts/{id}
     * Admin force-delete any post regardless of author.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> forceDeletePost(@PathVariable Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + id));

        // Clear associations before delete to avoid FK constraint issues
        post.getCommentaires().clear();
        post.getReactions().clear();
        post.getImages().clear();
        post.getReports().clear();
        postRepository.save(post);
        postRepository.deleteById(id);

        Map<String, Object> resp = new HashMap<>();
        resp.put("deleted", true);
        resp.put("postId", id);
        return ResponseEntity.ok(resp);
    }

    /**
     * PUT /api/admin/posts/{id}
     * Admin edit any post content.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Post> adminEditPost(
            @PathVariable Long id,
            @RequestBody Post body) {

        Post existing = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + id));

        if (body.getContenu() != null) existing.setContenu(body.getContenu());
        if (body.getTag()     != null) existing.setTag(body.getTag());
        if (body.getAnonyme() != null) existing.setAnonyme(body.getAnonyme());

        return ResponseEntity.ok(postRepository.save(existing));
    }

    /**
     * GET /api/admin/posts/stats
     * Aggregate community statistics for the admin dashboard.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getCommunityStats() {
        List<Post> allPosts = postService.recupererTout();

        long totalComments = allPosts.stream()
                .mapToLong(p -> p.getCommentaires() != null ? p.getCommentaires().size() : 0)
                .sum();

        long totalReactions = allPosts.stream()
                .mapToLong(p -> p.getReactions() != null ? p.getReactions().size() : 0)
                .sum();

        long totalReports = allPosts.stream()
                .mapToLong(p -> p.getReports() != null ? p.getReports().size() : 0)
                .sum();

        // Tag distribution
        Map<String, Long> tagCounts = new HashMap<>();
        allPosts.forEach(p -> {
            if (p.getTag() != null)
                tagCounts.merge(p.getTag(), 1L, Long::sum);
        });

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPosts",     allPosts.size());
        stats.put("totalComments",  totalComments);
        stats.put("totalReactions", totalReactions);
        stats.put("totalReports",   totalReports);
        stats.put("tagDistribution", tagCounts);

        return ResponseEntity.ok(stats);
    }
}