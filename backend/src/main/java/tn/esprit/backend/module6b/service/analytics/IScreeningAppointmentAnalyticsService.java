package tn.esprit.backend.module6b.service.analytics;

import tn.esprit.backend.module6b.dto.analytics.ScreeningAppointmentAnalyticsResponseDto;

public interface IScreeningAppointmentAnalyticsService {
    ScreeningAppointmentAnalyticsResponseDto getOverview();
}