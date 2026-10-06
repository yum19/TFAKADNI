package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.service.impl.BabyNameService;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class BabyNameController {

    private final BabyNameService babyNameService;

    // Allows both the mother (USER) and the partner (PARTNER) to generate names
    @PreAuthorize("hasAnyRole('USER', 'PARTNER')")
    @PostMapping("/baby-names")
    public ResponseEntity<?> generateBabyNames(@RequestBody Map<String, String> prefs) {
        try {
            return ResponseEntity.ok(babyNameService.generateNames(prefs));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Name generation failed: " + e.getMessage()));
        }
    }
}