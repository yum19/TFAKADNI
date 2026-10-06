package tn.esprit.backend.module6b.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6b.dto.analytics.ScreeningAnalyticsResponseDto;
import tn.esprit.backend.module6b.service.analytics.IScreeningAnalyticsService;

@RestController
@RequestMapping("/api/admin/postpartum/analytics/screenings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ScreeningAnalyticsAdminController {

    private final IScreeningAnalyticsService screeningAnalyticsService;

    @GetMapping("/overview")
    public ScreeningAnalyticsResponseDto getAnalyticsOverview() {
        return screeningAnalyticsService.getAnalyticsOverview();
    }
}