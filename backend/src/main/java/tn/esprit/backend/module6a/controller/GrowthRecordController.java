package tn.esprit.backend.module6a.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6a.dto.GrowthRecordRequestDTO;
import tn.esprit.backend.module6a.dto.GrowthRecordResponseDTO;
import tn.esprit.backend.module6a.service.IGrowthRecordService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/babies/{babyId}/growth-records")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class GrowthRecordController {

    private final IGrowthRecordService growthRecordService;

    @PostMapping
    public ResponseEntity<GrowthRecordResponseDTO> createGrowthRecord(
            Authentication authentication,
            @PathVariable Long babyId,
            @Valid @RequestBody GrowthRecordRequestDTO request
    ) {
        String email = authentication.getName();
        GrowthRecordResponseDTO response = growthRecordService.createGrowthRecord(email, babyId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<GrowthRecordResponseDTO>> getAllGrowthRecordsByBaby(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(growthRecordService.getAllGrowthRecordsByBaby(email, babyId));
    }

    @GetMapping("/{recordId}")
    public ResponseEntity<GrowthRecordResponseDTO> getGrowthRecordById(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long recordId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(growthRecordService.getGrowthRecordById(email, babyId, recordId));
    }

    @PutMapping("/{recordId}")
    public ResponseEntity<GrowthRecordResponseDTO> updateGrowthRecord(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long recordId,
            @Valid @RequestBody GrowthRecordRequestDTO request
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(growthRecordService.updateGrowthRecord(email, babyId, recordId, request));
    }

    @DeleteMapping("/{recordId}")
    public ResponseEntity<String> deleteGrowthRecord(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long recordId
    ) {
        String email = authentication.getName();
        growthRecordService.deleteGrowthRecord(email, babyId, recordId);
        return ResponseEntity.ok("Growth record deleted successfully");
    }

    @GetMapping("/latest")
    public ResponseEntity<GrowthRecordResponseDTO> getLatestGrowthRecord(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(growthRecordService.getLatestGrowthRecord(email, babyId));
    }

    @GetMapping("/chart")
    public ResponseEntity<List<GrowthRecordResponseDTO>> getGrowthChart(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(growthRecordService.getGrowthChart(email, babyId));
    }

    @GetMapping("/analysis")
    public ResponseEntity<Map<String, Object>> getGrowthAnalysis(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(growthRecordService.getGrowthAnalysis(email, babyId));
    }
}