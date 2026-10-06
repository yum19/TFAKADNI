package tn.esprit.backend.module6a.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6a.dto.BabyRequestDTO;
import tn.esprit.backend.module6a.dto.BabyResponseDTO;
import tn.esprit.backend.module6a.service.IBabyService;

import java.util.List;

@RestController
@RequestMapping("/api/babies")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class BabyController {

    private final IBabyService babyService;

    @PostMapping
    public ResponseEntity<BabyResponseDTO> createBaby(
            Authentication authentication,
            @Valid @RequestBody BabyRequestDTO request
    ) {
        String email = authentication.getName();
        BabyResponseDTO response = babyService.createBaby(email, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/my-babies")
    public ResponseEntity<List<BabyResponseDTO>> getMyBabies(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyService.getMyBabies(email));
    }

    @GetMapping("/{babyId}")
    public ResponseEntity<BabyResponseDTO> getBabyById(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyService.getBabyById(email, babyId));
    }

    @PutMapping("/{babyId}")
    public ResponseEntity<BabyResponseDTO> updateBaby(
            Authentication authentication,
            @PathVariable Long babyId,
            @RequestBody BabyRequestDTO request
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyService.updateBaby(email, babyId, request));
    }

    @DeleteMapping("/{babyId}")
    public ResponseEntity<String> deleteBaby(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        babyService.deleteBaby(email, babyId);
        return ResponseEntity.ok("Baby deleted successfully");
    }
}