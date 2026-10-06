package tn.esprit.backend.module6a.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6a.dto.CareScoreResponseDTO;
import tn.esprit.backend.module6a.service.ICareScoreService;

@RestController
@RequestMapping("/api/babies/{babyId}")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class CareScoreController {

    private final ICareScoreService careScoreService;

    @GetMapping("/care-score")
    public ResponseEntity<CareScoreResponseDTO> getCareScore(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(careScoreService.getCareScore(email, babyId));
    }
}