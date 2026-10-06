package tn.esprit.backend.module6a.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.backend.module6a.dto.BabyMilestoneResponseDTO;
import tn.esprit.backend.module6a.service.IBabyMilestoneService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/babies/{babyId}/milestones")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class BabyMilestoneController {

    private final IBabyMilestoneService babyMilestoneService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BabyMilestoneResponseDTO> createBabyMilestone(
            Authentication authentication,
            @PathVariable Long babyId,
            @RequestParam String title,
            @RequestParam String category,
            @RequestParam LocalDate milestoneDate,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String mediaType,
            @RequestPart(required = false) MultipartFile mediaFile
    ) {
        String email = authentication.getName();
        BabyMilestoneResponseDTO response = babyMilestoneService.createBabyMilestone(
                email, babyId, title, category, milestoneDate, description, mediaType, mediaFile
        );
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<BabyMilestoneResponseDTO>> getAllMilestonesByBaby(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyMilestoneService.getAllMilestonesByBaby(email, babyId));
    }

    @GetMapping("/{milestoneId}")
    public ResponseEntity<BabyMilestoneResponseDTO> getMilestoneById(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long milestoneId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyMilestoneService.getMilestoneById(email, babyId, milestoneId));
    }

    @PutMapping(value = "/{milestoneId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BabyMilestoneResponseDTO> updateMilestone(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long milestoneId,
            @RequestParam String title,
            @RequestParam String category,
            @RequestParam LocalDate milestoneDate,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String mediaType,
            @RequestPart(required = false) MultipartFile mediaFile
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(
                babyMilestoneService.updateMilestone(
                        email, babyId, milestoneId, title, category, milestoneDate, description, mediaType, mediaFile
                )
        );
    }

    @DeleteMapping("/{milestoneId}")
    public ResponseEntity<String> deleteMilestone(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long milestoneId
    ) {
        String email = authentication.getName();
        babyMilestoneService.deleteMilestone(email, babyId, milestoneId);
        return ResponseEntity.ok("Milestone deleted successfully");
    }

    @GetMapping("/latest")
    public ResponseEntity<BabyMilestoneResponseDTO> getLatestMilestone(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyMilestoneService.getLatestMilestone(email, babyId));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<BabyMilestoneResponseDTO>> getMilestonesByCategory(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable String category
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(babyMilestoneService.getMilestonesByCategory(email, babyId, category));
    }
}