package tn.esprit.backend.module6a.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6a.dto.DiaperLogRequestDTO;
import tn.esprit.backend.module6a.dto.DiaperLogResponseDTO;
import tn.esprit.backend.module6a.service.IDiaperLogService;

import java.util.List;

@RestController
@RequestMapping("/api/babies/{babyId}/diapers")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class DiaperLogController {

    private final IDiaperLogService diaperLogService;

    @PostMapping
    public ResponseEntity<DiaperLogResponseDTO> createDiaperLog(
            Authentication authentication,
            @PathVariable Long babyId,
            @Valid @RequestBody DiaperLogRequestDTO request
    ) {
        String email = authentication.getName();
        DiaperLogResponseDTO response = diaperLogService.createDiaperLog(email, babyId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<DiaperLogResponseDTO>> getAllDiaperLogsByBaby(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(diaperLogService.getAllDiaperLogsByBaby(email, babyId));
    }

    @GetMapping("/{diaperLogId}")
    public ResponseEntity<DiaperLogResponseDTO> getDiaperLogById(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long diaperLogId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(diaperLogService.getDiaperLogById(email, babyId, diaperLogId));
    }

    @PutMapping("/{diaperLogId}")
    public ResponseEntity<DiaperLogResponseDTO> updateDiaperLog(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long diaperLogId,
            @Valid @RequestBody DiaperLogRequestDTO request
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(diaperLogService.updateDiaperLog(email, babyId, diaperLogId, request));
    }

    @DeleteMapping("/{diaperLogId}")
    public ResponseEntity<String> deleteDiaperLog(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long diaperLogId
    ) {
        String email = authentication.getName();
        diaperLogService.deleteDiaperLog(email, babyId, diaperLogId);
        return ResponseEntity.ok("Diaper log deleted successfully");
    }

    @GetMapping("/today")
    public ResponseEntity<List<DiaperLogResponseDTO>> getTodayDiaperLogs(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(diaperLogService.getTodayDiaperLogs(email, babyId));
    }
}