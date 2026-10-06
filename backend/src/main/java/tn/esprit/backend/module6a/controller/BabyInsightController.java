package tn.esprit.backend.module6a.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6a.dto.BabyInsightResponseDTO;
import tn.esprit.backend.module6a.service.IBabyInsightService;

import java.util.List;

@RestController
@RequestMapping("/api/babies/{babyId}/insights")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class BabyInsightController {

    private final IBabyInsightService babyInsightService;

    @GetMapping
    public ResponseEntity<List<BabyInsightResponseDTO>> getAllInsights(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyInsightService.getAllInsightsByBaby(email, babyId));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<BabyInsightResponseDTO>> getUnreadInsights(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyInsightService.getUnreadInsightsByBaby(email, babyId));
    }

    @PostMapping("/generate")
    public ResponseEntity<List<BabyInsightResponseDTO>> generateInsights(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyInsightService.generateInsightsForBaby(email, babyId));
    }

    @PutMapping("/{insightId}/read")
    public ResponseEntity<BabyInsightResponseDTO> markAsRead(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long insightId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyInsightService.markAsRead(email, babyId, insightId));
    }

    @PutMapping("/{insightId}/dismiss")
    public ResponseEntity<BabyInsightResponseDTO> dismissInsight(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long insightId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyInsightService.dismissInsight(email, babyId, insightId));
    }

    @PutMapping("/{insightId}/resolve")
    public ResponseEntity<BabyInsightResponseDTO> resolveInsight(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long insightId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyInsightService.resolveInsight(email, babyId, insightId));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        babyInsightService.markAllAsRead(email, babyId);
        return ResponseEntity.noContent().build();
    }
}