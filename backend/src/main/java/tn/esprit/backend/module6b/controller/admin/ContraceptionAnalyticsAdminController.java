package tn.esprit.backend.module6b.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6b.dto.analytics.ContraceptionAnalyticsResponseDto;
import tn.esprit.backend.module6b.service.analytics.IContraceptionAnalyticsService;

@RestController
@RequestMapping("/api/admin/postpartum/analytics/contraception")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ContraceptionAnalyticsAdminController {

    private final IContraceptionAnalyticsService contraceptionAnalyticsService;

    @GetMapping("/overview")
    public ContraceptionAnalyticsResponseDto getAnalyticsOverview() {
        return contraceptionAnalyticsService.getAnalyticsOverview();
    }
}