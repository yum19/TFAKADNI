package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.CommentReactionSummaryDTO;
import tn.esprit.backend.entity.ReactionType;
import tn.esprit.backend.service.CommentReactionService;

@RestController
@RequestMapping("/api/comments/{commentId}/reactions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CommentReactionController {

    private final CommentReactionService commentReactionService;

    @GetMapping
    public ResponseEntity<CommentReactionSummaryDTO> getSummary(Authentication authentication,
                                                                @PathVariable Long commentId) {
        return ResponseEntity.ok(
                commentReactionService.getSummary(commentId, authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<CommentReactionSummaryDTO> react(Authentication authentication,
                                                           @PathVariable Long commentId,
                                                           @RequestParam ReactionType type) {
        return ResponseEntity.ok(
                commentReactionService.react(commentId, authentication.getName(), type));
    }
}