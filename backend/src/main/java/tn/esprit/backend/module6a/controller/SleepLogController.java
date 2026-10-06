package tn.esprit.backend.module6a.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6a.dto.SleepLogRequestDTO;
import tn.esprit.backend.module6a.dto.SleepLogResponseDTO;
import tn.esprit.backend.module6a.service.ISleepLogService;

import java.util.List;

@RestController
@RequestMapping("/api/babies/{babyId}/sleep-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class SleepLogController {

    private final ISleepLogService sleepLogService;

    @PostMapping
    public ResponseEntity<SleepLogResponseDTO> createSleepLog(
            Authentication authentication,
            @PathVariable Long babyId,
            @Valid @RequestBody SleepLogRequestDTO request
    ) {
        String email = authentication.getName();
        SleepLogResponseDTO response = sleepLogService.createSleepLog(email, babyId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<SleepLogResponseDTO>> getAllSleepLogsByBaby(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(sleepLogService.getAllSleepLogsByBaby(email, babyId));
    }

    @GetMapping("/{sleepLogId}")
    public ResponseEntity<SleepLogResponseDTO> getSleepLogById(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long sleepLogId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(sleepLogService.getSleepLogById(email, babyId, sleepLogId));
    }

    @PutMapping("/{sleepLogId}")
    public ResponseEntity<SleepLogResponseDTO> updateSleepLog(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long sleepLogId,
            @Valid @RequestBody SleepLogRequestDTO request
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(sleepLogService.updateSleepLog(email, babyId, sleepLogId, request));
    }

    @DeleteMapping("/{sleepLogId}")
    public ResponseEntity<String> deleteSleepLog(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long sleepLogId
    ) {
        String email = authentication.getName();
        sleepLogService.deleteSleepLog(email, babyId, sleepLogId);
        return ResponseEntity.ok("Sleep log deleted successfully");
    }
}