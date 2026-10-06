package tn.esprit.backend.module6a.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6a.dto.BabyPredictionResponseDTO;
import tn.esprit.backend.module6a.dto.BabyRhythmProfileResponseDTO;
import tn.esprit.backend.module6a.service.IBabyRhythmService;

@RestController
@RequestMapping("/api/babies/{babyId}")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class BabyRhythmController {

    private final IBabyRhythmService babyRhythmService;

    @PostMapping("/rhythm-profile/recalculate")
    public ResponseEntity<BabyRhythmProfileResponseDTO> recalculateRhythmProfile(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyRhythmService.recalculateRhythmProfile(email, babyId));
    }

    @GetMapping("/rhythm-profile")
    public ResponseEntity<BabyRhythmProfileResponseDTO> getRhythmProfile(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyRhythmService.getRhythmProfile(email, babyId));
    }

    @GetMapping("/predictions/next-feeding")
    public ResponseEntity<BabyPredictionResponseDTO> predictNextFeeding(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyRhythmService.predictNextFeeding(email, babyId));
    }

    @GetMapping("/predictions/next-sleep")
    public ResponseEntity<BabyPredictionResponseDTO> predictNextSleep(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyRhythmService.predictNextSleep(email, babyId));
    }

    @GetMapping("/predictions/daily-rhythm")
    public ResponseEntity<BabyRhythmProfileResponseDTO> getDailyRhythm(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyRhythmService.getRhythmProfile(email, babyId));
    }
}