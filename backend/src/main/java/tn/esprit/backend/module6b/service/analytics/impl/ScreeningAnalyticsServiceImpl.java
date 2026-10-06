package tn.esprit.backend.module6b.service.analytics.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.backend.module6b.dto.analytics.*;
import tn.esprit.backend.module6b.entity.PredictionResult;
import tn.esprit.backend.module6b.repository.analytics.ScreeningAnalyticsRepository;
import tn.esprit.backend.module6b.service.analytics.IScreeningAnalyticsService;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScreeningAnalyticsServiceImpl implements IScreeningAnalyticsService {

    private final ScreeningAnalyticsRepository screeningAnalyticsRepository;

    @Override
    public ScreeningAnalyticsResponseDto getAnalyticsOverview() {
        List<PredictionResult> predictions = screeningAnalyticsRepository.findAllPredictionsWithScreening();

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

        double averageConfidence = predictions.isEmpty()
                ? 0.0
                : predictions.stream()
                .filter(p -> p.getConfidence() != null)
                .mapToDouble(PredictionResult::getConfidence)
                .average()
                .orElse(0.0);

        String dominantRiskLevel = resolveDominantRiskLevel(lowRiskCount, moderateRiskCount, highRiskCount);

        String latestModelVersion = predictions.stream()
                .filter(p -> p.getModelVersion() != null && !p.getModelVersion().isBlank())
                .reduce((first, second) -> second)
                .map(PredictionResult::getModelVersion)
                .orElse("N/A");

        ScreeningAnalyticsOverviewDto overview = ScreeningAnalyticsOverviewDto.builder()
                .totalPredictions(totalPredictions)
                .lowRiskCount(lowRiskCount)
                .moderateRiskCount(moderateRiskCount)
                .highRiskCount(highRiskCount)
                .averageConfidence(round(averageConfidence * 100.0))
                .dominantRiskLevel(dominantRiskLevel)
                .latestModelVersion(latestModelVersion)
                .build();

        List<ScreeningRiskDistributionItemDto> riskDistribution = buildRiskDistribution(
                totalPredictions,
                lowRiskCount,
                moderateRiskCount,
                highRiskCount
        );

        List<ScreeningWeeklyTrendItemDto> weeklyTrend = buildWeeklyTrend(predictions);

        return ScreeningAnalyticsResponseDto.builder()
                .overview(overview)
                .riskDistribution(riskDistribution)
                .weeklyTrend(weeklyTrend)
                .build();
    }

    private List<ScreeningRiskDistributionItemDto> buildRiskDistribution(
            long totalPredictions,
            long lowRiskCount,
            long moderateRiskCount,
            long highRiskCount
    ) {
        return List.of(
                ScreeningRiskDistributionItemDto.builder()
                        .riskLevel("LOW")
                        .count(lowRiskCount)
                        .percentage(percentage(lowRiskCount, totalPredictions))
                        .color("#6d8dff")
                        .build(),
                ScreeningRiskDistributionItemDto.builder()
                        .riskLevel("MODERATE")
                        .count(moderateRiskCount)
                        .percentage(percentage(moderateRiskCount, totalPredictions))
                        .color("#f7a62c")
                        .build(),
                ScreeningRiskDistributionItemDto.builder()
                        .riskLevel("HIGH")
                        .count(highRiskCount)
                        .percentage(percentage(highRiskCount, totalPredictions))
                        .color("#ef476f")
                        .build()
        );
    }

    private List<ScreeningWeeklyTrendItemDto> buildWeeklyTrend(List<PredictionResult> predictions) {
        WeekFields weekFields = WeekFields.ISO;

        Map<String, List<PredictionResult>> grouped = predictions.stream()
                .filter(p -> p.getPredictionDate() != null)
                .collect(Collectors.groupingBy(p -> {
                    LocalDate date = p.getPredictionDate().toLocalDate();
                    int week = date.get(weekFields.weekOfWeekBasedYear());
                    int year = date.get(weekFields.weekBasedYear());
                    return year + "-W" + String.format("%02d", week);
                }, TreeMap::new, Collectors.toList()));

        return grouped.entrySet().stream()
                .map(entry -> {
                    List<PredictionResult> weekPredictions = entry.getValue();

                    long low = weekPredictions.stream()
                            .filter(p -> "LOW".equalsIgnoreCase(p.getRiskLevel()))
                            .count();

                    long moderate = weekPredictions.stream()
                            .filter(p -> "MODERATE".equalsIgnoreCase(p.getRiskLevel()))
                            .count();

                    long high = weekPredictions.stream()
                            .filter(p -> "HIGH".equalsIgnoreCase(p.getRiskLevel()))
                            .count();

                    return ScreeningWeeklyTrendItemDto.builder()
                            .weekLabel(entry.getKey())
                            .totalPredictions(weekPredictions.size())
                            .lowCount(low)
                            .moderateCount(moderate)
                            .highCount(high)
                            .build();
                })
                .toList();
    }

    private String resolveDominantRiskLevel(long low, long moderate, long high) {
        Map<String, Long> values = new LinkedHashMap<>();
        values.put("LOW", low);
        values.put("MODERATE", moderate);
        values.put("HIGH", high);

        return values.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
    }

    private double percentage(long value, long total) {
        if (total == 0) return 0.0;
        return round((value * 100.0) / total);
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}