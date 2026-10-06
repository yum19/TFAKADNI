package tn.esprit.backend.module6a.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6a.dto.TodaySummaryResponseDTO;
import tn.esprit.backend.module6a.service.ITodaySummaryService;

@RestController
@RequestMapping("/api/babies/{babyId}")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class TodaySummaryController {

    private final ITodaySummaryService todaySummaryService;

    @GetMapping("/summary/today")
    public ResponseEntity<TodaySummaryResponseDTO> getTodaySummary(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(todaySummaryService.getTodaySummary(email, babyId));
    }
}