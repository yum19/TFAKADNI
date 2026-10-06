package tn.esprit.backend.module6a.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6a.dto.BabyDashboardResponseDTO;
import tn.esprit.backend.module6a.service.IDashboardService;

@RestController
@RequestMapping("/api/babies/{babyId}/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class DashboardController {

    private final IDashboardService dashboardService;

    @GetMapping
    public ResponseEntity<BabyDashboardResponseDTO> getDashboard(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(dashboardService.getDashboard(email, babyId));
    }
}