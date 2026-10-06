package tn.esprit.backend.module6a.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6a.dto.FeedingRequestDTO;
import tn.esprit.backend.module6a.dto.FeedingResponseDTO;
import tn.esprit.backend.module6a.service.IFeedingService;

import java.util.List;

@RestController
@RequestMapping("/api/babies/{babyId}/feedings")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class FeedingController {

    private final IFeedingService feedingService;

    @PostMapping
    public ResponseEntity<FeedingResponseDTO> createFeeding(
            Authentication authentication,
            @PathVariable Long babyId,
            @Valid @RequestBody FeedingRequestDTO request
    ) {
        String email = authentication.getName();
        FeedingResponseDTO response = feedingService.createFeeding(email, babyId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<FeedingResponseDTO>> getAllFeedingsByBaby(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(feedingService.getAllFeedingsByBaby(email, babyId));
    }

    @GetMapping("/{feedingId}")
    public ResponseEntity<FeedingResponseDTO> getFeedingById(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long feedingId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(feedingService.getFeedingById(email, babyId, feedingId));
    }

    @PutMapping("/{feedingId}")
    public ResponseEntity<FeedingResponseDTO> updateFeeding(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long feedingId,
            @Valid @RequestBody FeedingRequestDTO request
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(feedingService.updateFeeding(email, babyId, feedingId, request));
    }

    @DeleteMapping("/{feedingId}")
    public ResponseEntity<String> deleteFeeding(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long feedingId
    ) {
        String email = authentication.getName();
        feedingService.deleteFeeding(email, babyId, feedingId);
        return ResponseEntity.ok("Feeding deleted successfully");
    }
}