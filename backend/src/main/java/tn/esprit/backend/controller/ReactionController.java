package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.ReactionSummaryDTO;
import tn.esprit.backend.entity.ReactionType;
import tn.esprit.backend.service.ReactionService;

@RestController
@RequestMapping("/api/posts/{postId}/reactions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReactionController {

    private final ReactionService reactionService;

    @GetMapping
    public ResponseEntity<ReactionSummaryDTO> getSummary(Authentication authentication,
                                                         @PathVariable Long postId) {
        return ResponseEntity.ok(reactionService.getSummary(postId, authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<ReactionSummaryDTO> react(Authentication authentication,
                                                    @PathVariable Long postId,
                                                    @RequestParam ReactionType type) {
        return ResponseEntity.ok(reactionService.react(postId, authentication.getName(), type));
    }
}