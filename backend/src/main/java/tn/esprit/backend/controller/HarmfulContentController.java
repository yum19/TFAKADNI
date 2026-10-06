package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.PostAnalysisDTO;
import tn.esprit.backend.dto.response.ApiResponse;
import tn.esprit.backend.service.HarmfulContentService;

/**
 * REST endpoints for the harmful-content detection feature.
 *
 * GET  /api/posts/{postId}/analysis         → fetch stored ML analysis
 * POST /api/posts/{postId}/analysis/trigger → manually re-run ML analysis
 * POST /api/posts/{postId}/analysis/acknowledge → author dismisses the warning
 */
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HarmfulContentController {

    private final HarmfulContentService harmfulContentService;

    /**
     * GET /api/posts/{postId}/analysis
     * Returns the current harmful-content analysis for a post.
     * The Angular frontend calls this after loading a post.
     */
    @GetMapping("/{postId}/analysis")
    public ResponseEntity<ApiResponse<PostAnalysisDTO>> getAnalysis(@PathVariable Long postId) {
        PostAnalysisDTO dto = harmfulContentService.getAnalysis(postId);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    /**
     * POST /api/posts/{postId}/analysis/trigger
     * Body: { "text": "..." }
     * Manually triggers the ML analysis (e.g. called right after post creation
     * if the frontend wants to display an immediate result without polling).
     */
    @PostMapping("/{postId}/analysis/trigger")
    public ResponseEntity<ApiResponse<PostAnalysisDTO>> triggerAnalysis(
            @PathVariable Long postId,
            @RequestBody java.util.Map<String, String> body
    ) {
        String text = body.getOrDefault("text", "");
        PostAnalysisDTO dto = harmfulContentService.analyseAndPersist(postId, text);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    /**
     * POST /api/posts/{postId}/analysis/acknowledge
     * Called when the post author clicks "I understand" on the warning banner.
     * Marks authorAcknowledged = true so the warning is not shown again.
     */
    @PostMapping("/{postId}/analysis/acknowledge")
    public ResponseEntity<ApiResponse<PostAnalysisDTO>> acknowledge(
            @PathVariable Long postId,
            Authentication authentication
    ) {
        PostAnalysisDTO dto = harmfulContentService.acknowledge(postId);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }
}