package tn.esprit.backend.module6b.service.analytics;

import tn.esprit.backend.module6b.dto.analytics.ScreeningAnalyticsResponseDto;

public interface IScreeningAnalyticsService {
    ScreeningAnalyticsResponseDto getAnalyticsOverview();
}