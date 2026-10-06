package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.service.impl.AiService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    // ── Vitals Analysis ───────────────────────────────────
    // Secured: Only the active mother should request analysis of vitals
    @PreAuthorize("hasRole('USER')")
    @PostMapping("/analyze-vitals")
    public ResponseEntity<Map<String, String>> analyzeVitals(
            @RequestBody List<Map<String, Object>> vitals) {
        String analysis = aiService.analyzeVitals(vitals);
        return ResponseEntity.ok(Map.of("analysis", analysis));
    }

    // ── Baby Portrait ─────────────────────────────────────
    // Secured: Only the active mother (and maybe partner) should generate baby portraits
    @PreAuthorize("hasAnyRole('USER', 'PARTNER')")
    @PostMapping("/baby-portrait")
    public ResponseEntity<Map<String, String>> babyPortrait(
            @RequestBody Map<String, Object> request) {
        String portrait = aiService.generateBabyPortrait(request);
        return ResponseEntity.ok(Map.of("portrait", portrait));
    }
}