package tn.esprit.backend.module6a.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6a.dto.TimelineEventResponseDTO;
import tn.esprit.backend.module6a.service.IBabyTimelineService;

import java.util.List;

@RestController
@RequestMapping("/api/babies/{babyId}")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class BabyTimelineController {

    private final IBabyTimelineService babyTimelineService;

    @GetMapping("/timeline")
    public ResponseEntity<List<TimelineEventResponseDTO>> getTimeline(
            Authentication authentication,
            @PathVariable Long babyId,
            @RequestParam(required = false) Integer days
    ) {
        String email = authentication.getName();

        if (days != null) {
            return ResponseEntity.ok(babyTimelineService.getTimeline(email, babyId, days));
        }

        return ResponseEntity.ok(babyTimelineService.getTimeline(email, babyId));
    }
}