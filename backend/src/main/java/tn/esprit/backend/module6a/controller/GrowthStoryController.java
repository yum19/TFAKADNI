package tn.esprit.backend.module6a.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6a.dto.GrowthStoryResponseDTO;
import tn.esprit.backend.module6a.service.IGrowthStoryService;

@RestController
@RequestMapping("/api/babies/{babyId}")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class GrowthStoryController {

    private final IGrowthStoryService growthStoryService;

    @GetMapping("/growth-story")
    public ResponseEntity<GrowthStoryResponseDTO> getGrowthStory(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(growthStoryService.getGrowthStory(email, babyId));
    }
}