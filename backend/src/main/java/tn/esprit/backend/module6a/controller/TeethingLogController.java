package tn.esprit.backend.module6a.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6a.dto.TeethingLogRequestDTO;
import tn.esprit.backend.module6a.dto.TeethingLogResponseDTO;
import tn.esprit.backend.module6a.service.ITeethingLogService;

import java.util.List;

@RestController
@RequestMapping("/api/babies/{babyId}/teething")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class TeethingLogController {

    private final ITeethingLogService teethingLogService;

    @PostMapping
    public ResponseEntity<TeethingLogResponseDTO> createTeethingLog(
            Authentication authentication,
            @PathVariable Long babyId,
            @Valid @RequestBody TeethingLogRequestDTO request
    ) {
        String email = authentication.getName();
        TeethingLogResponseDTO response = teethingLogService.createTeethingLog(email, babyId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<TeethingLogResponseDTO>> getAllTeethingLogsByBaby(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(teethingLogService.getAllTeethingLogsByBaby(email, babyId));
    }

    @GetMapping("/{teethingLogId}")
    public ResponseEntity<TeethingLogResponseDTO> getTeethingLogById(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long teethingLogId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(teethingLogService.getTeethingLogById(email, babyId, teethingLogId));
    }

    @PutMapping("/{teethingLogId}")
    public ResponseEntity<TeethingLogResponseDTO> updateTeethingLog(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long teethingLogId,
            @Valid @RequestBody TeethingLogRequestDTO request
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(teethingLogService.updateTeethingLog(email, babyId, teethingLogId, request));
    }

    @DeleteMapping("/{teethingLogId}")
    public ResponseEntity<String> deleteTeethingLog(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long teethingLogId
    ) {
        String email = authentication.getName();
        teethingLogService.deleteTeethingLog(email, babyId, teethingLogId);
        return ResponseEntity.ok("Teething log deleted successfully");
    }

    @GetMapping("/latest")
    public ResponseEntity<TeethingLogResponseDTO> getLatestTeethingLog(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(teethingLogService.getLatestTeethingLog(email, babyId));
    }
}