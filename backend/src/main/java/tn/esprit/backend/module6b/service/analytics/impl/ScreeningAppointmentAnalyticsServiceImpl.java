package tn.esprit.backend.module6b.service.analytics.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.backend.module6b.dto.analytics.*;
import tn.esprit.backend.module6b.entity.PredictionResult;
import tn.esprit.backend.module6b.entity.PsychAppointment;
import tn.esprit.backend.module6b.repository.analytics.ScreeningAppointmentAnalyticsRepository;
import tn.esprit.backend.module6b.service.analytics.IScreeningAppointmentAnalyticsService;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScreeningAppointmentAnalyticsServiceImpl implements IScreeningAppointmentAnalyticsService {

    private final ScreeningAppointmentAnalyticsRepository analyticsRepository;

    @Override
    public ScreeningAppointmentAnalyticsResponseDto getOverview() {
        List<PredictionResult> predictions = analyticsRepository.findAllPredictionsWithScreening();
        List<PsychAppointment> linkedAppointments = analyticsRepository.findAllAppointmentsLinkedToPrediction();

        Map<Long, List<PsychAppointment>> appointmentsByPredictionId =
                analyticsRepository.groupAppointmentsByPredictionId(linkedAppointments);

        long totalPredictions = predictions.size();

        long lowRiskCount = predictions.stream()
                .filter(p -> "LOW".equalsIgnoreCase(p.getRiskLevel()))
                .count();

        long moderateRiskCount = predictions.stream()
                .filter(p -> "MODERATE".equalsIgnoreCase(p.getRiskLevel()))
                .count();

        long highRiskCount = predictions.stream()
                .filter(p -> "HIGH".equalsIgnoreCase(p.getRiskLevel()))
                .count();

        List<PredictionResult> highRiskPredictions = predictions.stream()
                .filter(p -> "HIGH".equalsIgnoreCase(p.getRiskLevel()))
                .toList();

        long highRiskWithAppointment = highRiskPredictions.stream()
                .filter(p -> appointmentsByPredictionId.containsKey(p.getId()))
                .count();

        long highRiskWithoutAppointment = highRiskCount - highRiskWithAppointment;

        double highRiskFollowUpRate = highRiskCount == 0
                ? 0.0
                : (highRiskWithAppointment * 100.0) / highRiskCount;

        double averageDelayDays =
                analyticsRepository.computeAverageDelayDays(highRiskPredictions, appointmentsByPredictionId);

        long plannedAppointmentsLinkedToPrediction = linkedAppointments.stream()
                .filter(a -> "PLANNED".equalsIgnoreCase(a.getStatus()))
                .count();

        long completedAppointmentsLinkedToPrediction = linkedAppointments.stream()
                .filter(a -> "COMPLETED".equalsIgnoreCase(a.getStatus()))
                .count();

        long cancelledAppointmentsLinkedToPrediction = linkedAppointments.stream()
                .filter(a -> "CANCELLED".equalsIgnoreCase(a.getStatus()))
                .count();

        ScreeningAppointmentOverviewDto overview = ScreeningAppointmentOverviewDto.builder()
                .totalPredictions(totalPredictions)
                .lowRiskCount(lowRiskCount)
                .moderateRiskCount(moderateRiskCount)
                .highRiskCount(highRiskCount)
                .highRiskWithAppointment(highRiskWithAppointment)
                .highRiskWithoutAppointment(highRiskWithoutAppointment)
                .highRiskFollowUpRate(round(highRiskFollowUpRate))
                .averageDelayDays(round(averageDelayDays))
                .plannedAppointmentsLinkedToPrediction(plannedAppointmentsLinkedToPrediction)
                .completedAppointmentsLinkedToPrediction(completedAppointmentsLinkedToPrediction)
                .cancelledAppointmentsLinkedToPrediction(cancelledAppointmentsLinkedToPrediction)
                .build();

        List<RiskAppointmentStatusRowDto> matrix = buildMatrix(predictions, appointmentsByPredictionId);

        return ScreeningAppointmentAnalyticsResponseDto.builder()
                .overview(overview)
                .matrix(matrix)
                .build();
    }

    private List<RiskAppointmentStatusRowDto> buildMatrix(
            List<PredictionResult> predictions,
            Map<Long, List<PsychAppointment>> appointmentsByPredictionId
    ) {
        List<String> orderedLevels = List.of("LOW", "MODERATE", "HIGH");

        return orderedLevels.stream().map(level -> {
            List<PredictionResult> filtered = predictions.stream()
                    .filter(p -> level.equalsIgnoreCase(p.getRiskLevel()))
                    .toList();

            long total = filtered.size();

            long linkedAppointments = filtered.stream()
                    .filter(p -> appointmentsByPredictionId.containsKey(p.getId()))
                    .count();

            long noAppointment = total - linkedAppointments;

            long plannedCount = countStatus(filtered, appointmentsByPredictionId, "PLANNED");
            long completedCount = countStatus(filtered, appointmentsByPredictionId, "COMPLETED");
            long cancelledCount = countStatus(filtered, appointmentsByPredictionId, "CANCELLED");

            return RiskAppointmentStatusRowDto.builder()
                    .riskLevel(level)
                    .totalPredictions(total)
                    .linkedAppointments(linkedAppointments)
                    .noAppointment(noAppointment)
                    .plannedCount(plannedCount)
                    .completedCount(completedCount)
                    .cancelledCount(cancelledCount)
                    .build();
        }).collect(Collectors.toList());
    }

    private long countStatus(
            List<PredictionResult> predictions,
            Map<Long, List<PsychAppointment>> appointmentsByPredictionId,
            String status
    ) {
        return predictions.stream()
                .map(PredictionResult::getId)
                .filter(Objects::nonNull)
                .map(appointmentsByPredictionId::get)
                .filter(Objects::nonNull)
                .flatMap(List::stream)
                .filter(a -> status.equalsIgnoreCase(a.getStatus()))
                .count();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}