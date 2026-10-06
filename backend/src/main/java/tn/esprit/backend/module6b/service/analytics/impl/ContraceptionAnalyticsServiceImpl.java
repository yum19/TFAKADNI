package tn.esprit.backend.module6b.service.analytics.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.backend.module6b.dto.analytics.*;
import tn.esprit.backend.module6b.entity.ContraceptionChatMessage;
import tn.esprit.backend.module6b.entity.ContraceptionLog;
import tn.esprit.backend.module6b.entity.ContraceptionProfile;
import tn.esprit.backend.module6b.repository.analytics.ContraceptionAnalyticsRepository;
import tn.esprit.backend.module6b.service.analytics.IContraceptionAnalyticsService;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContraceptionAnalyticsServiceImpl implements IContraceptionAnalyticsService {

    private final ContraceptionAnalyticsRepository contraceptionAnalyticsRepository;

    @Override
    public ContraceptionAnalyticsResponseDto getAnalyticsOverview() {
        List<ContraceptionProfile> profiles = contraceptionAnalyticsRepository.findAllProfiles();
        List<ContraceptionLog> logs = contraceptionAnalyticsRepository.findAllLogs();
        List<ContraceptionChatMessage> chatMessages = contraceptionAnalyticsRepository.findAllChatMessages();

        long totalRecommendations = profiles.size();
        long activeMethodsCount = logs.stream()
                .filter(log -> "ACTIVE".equalsIgnoreCase(log.getStatus()))
                .count();

        long totalChatMessages = chatMessages.size();
        long totalChatSessions = chatMessages.stream()
                .map(ContraceptionChatMessage::getSessionId)
                .filter(Objects::nonNull)
                .filter(session -> !session.isBlank())
                .distinct()
                .count();

        long breastfeedingYes = profiles.stream()
                .filter(profile -> Boolean.TRUE.equals(profile.getIsBreastfeeding()))
                .count();

        long breastfeedingNo = profiles.stream()
                .filter(profile -> Boolean.FALSE.equals(profile.getIsBreastfeeding()))
                .count();

        Set<Long> mothersWithRecommendation = profiles.stream()
                .map(profile -> profile.getMother() != null ? profile.getMother().getId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<Long> mothersWithActiveLog = logs.stream()
                .filter(log -> "ACTIVE".equalsIgnoreCase(log.getStatus()))
                .map(log -> log.getMother() != null ? log.getMother().getId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        long convertedMothersCount = mothersWithRecommendation.stream()
                .filter(mothersWithActiveLog::contains)
                .count();

        double recommendationConversionRate = mothersWithRecommendation.isEmpty()
                ? 0.0
                : round((convertedMothersCount * 100.0) / mothersWithRecommendation.size());

        String topRecommendedPreference = resolveTopPreference(profiles);
        String topActiveMethod = resolveTopActiveMethod(logs);

        ContraceptionAnalyticsOverviewDto overview = ContraceptionAnalyticsOverviewDto.builder()
                .totalRecommendations(totalRecommendations)
                .activeMethodsCount(activeMethodsCount)
                .totalChatMessages(totalChatMessages)
                .totalChatSessions(totalChatSessions)
                .recommendationConversionRate(recommendationConversionRate)
                .topRecommendedPreference(topRecommendedPreference)
                .topActiveMethod(topActiveMethod)
                .build();

        ContraceptionBreastfeedingStatsDto breastfeedingStats = ContraceptionBreastfeedingStatsDto.builder()
                .breastfeedingYes(breastfeedingYes)
                .breastfeedingNo(breastfeedingNo)
                .build();

        List<ContraceptionPreferenceItemDto> topPreferences = buildTopPreferences(profiles);
        List<ContraceptionMethodStatusItemDto> methodStatusMatrix = buildMethodStatusMatrix(logs);
        List<ContraceptionWeeklyTrendItemDto> weeklyTrend = buildWeeklyTrend(profiles);

        return ContraceptionAnalyticsResponseDto.builder()
                .overview(overview)
                .breastfeedingStats(breastfeedingStats)
                .topPreferences(topPreferences)
                .methodStatusMatrix(methodStatusMatrix)
                .weeklyTrend(weeklyTrend)
                .build();
    }

    private String resolveTopPreference(List<ContraceptionProfile> profiles) {
        return profiles.stream()
                .map(ContraceptionProfile::getPreference)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
                .entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
    }

    private String resolveTopActiveMethod(List<ContraceptionLog> logs) {
        return logs.stream()
                .filter(log -> "ACTIVE".equalsIgnoreCase(log.getStatus()))
                .map(ContraceptionLog::getMethod)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
                .entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
    }

    private List<ContraceptionPreferenceItemDto> buildTopPreferences(List<ContraceptionProfile> profiles) {
        return profiles.stream()
                .map(ContraceptionProfile::getPreference)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(6)
                .map(entry -> ContraceptionPreferenceItemDto.builder()
                        .preference(entry.getKey())
                        .count(entry.getValue())
                        .build())
                .toList();
    }

    private List<ContraceptionMethodStatusItemDto> buildMethodStatusMatrix(List<ContraceptionLog> logs) {
        Map<String, List<ContraceptionLog>> groupedByMethod = logs.stream()
                .filter(log -> log.getMethod() != null && !log.getMethod().isBlank())
                .collect(Collectors.groupingBy(log -> log.getMethod().trim(), TreeMap::new, Collectors.toList()));

        return groupedByMethod.entrySet().stream()
                .map(entry -> {
                    List<ContraceptionLog> methodLogs = entry.getValue();

                    long activeCount = methodLogs.stream()
                            .filter(log -> "ACTIVE".equalsIgnoreCase(log.getStatus()))
                            .count();

                    long stoppedCount = methodLogs.stream()
                            .filter(log -> "STOPPED".equalsIgnoreCase(log.getStatus()))
                            .count();

                    long changedCount = methodLogs.stream()
                            .filter(log -> "CHANGED".equalsIgnoreCase(log.getStatus()))
                            .count();

                    return ContraceptionMethodStatusItemDto.builder()
                            .method(entry.getKey())
                            .activeCount(activeCount)
                            .stoppedCount(stoppedCount)
                            .changedCount(changedCount)
                            .build();
                })
                .toList();
    }

    private List<ContraceptionWeeklyTrendItemDto> buildWeeklyTrend(List<ContraceptionProfile> profiles) {
        WeekFields weekFields = WeekFields.ISO;

        Map<String, Long> grouped = profiles.stream()
                .filter(profile -> profile.getCreatedAt() != null)
                .collect(Collectors.groupingBy(profile -> {
                    LocalDate date = profile.getCreatedAt().toLocalDate();
                    int week = date.get(weekFields.weekOfWeekBasedYear());
                    int year = date.get(weekFields.weekBasedYear());
                    return year + "-W" + String.format("%02d", week);
                }, TreeMap::new, Collectors.counting()));

        return grouped.entrySet().stream()
                .map(entry -> ContraceptionWeeklyTrendItemDto.builder()
                        .weekLabel(entry.getKey())
                        .recommendationsCount(entry.getValue())
                        .build())
                .toList();
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}