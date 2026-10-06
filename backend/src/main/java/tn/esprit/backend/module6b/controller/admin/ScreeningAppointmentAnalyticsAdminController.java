package tn.esprit.backend.module6b.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6b.dto.analytics.ScreeningAppointmentAnalyticsResponseDto;
import tn.esprit.backend.module6b.service.analytics.IScreeningAppointmentAnalyticsService;

@RestController
@RequestMapping("/api/admin/postpartum/analytics/screening-appointments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ScreeningAppointmentAnalyticsAdminController {

    private final IScreeningAppointmentAnalyticsService analyticsService;

    @GetMapping("/overview")
    public ScreeningAppointmentAnalyticsResponseDto getOverview() {
        return analyticsService.getOverview();
    }
}