package tn.esprit.backend.module6a.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.module6a.dto.BabyInsightResponseDTO;
import tn.esprit.backend.module6a.entity.*;
import tn.esprit.backend.module6a.exception.BabyNotFoundException;
import tn.esprit.backend.module6a.exception.Module6aResourceNotFoundException;
import tn.esprit.backend.module6a.repository.*;
import tn.esprit.backend.module6a.service.IBabyInsightService;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BabyInsightServiceImpl implements IBabyInsightService {

    private static final long DISMISS_COOLDOWN_DAYS = 7;

    private final BabyInsightRepository babyInsightRepository;
    private final BabyRepository babyRepository;
    private final SleepLogRepository sleepLogRepository;
    private final GrowthRecordRepository growthRecordRepository;
    private final FeedingRepository feedingRepository;
    private final DiaperLogRepository diaperLogRepository;
    private final TeethingLogRepository teethingLogRepository;
    private final BabyMilestoneRepository babyMilestoneRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<BabyInsightResponseDTO> getAllInsightsByBaby(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return babyInsightRepository.findByBabyIdOrderByGeneratedAtDescIdDesc(babyId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BabyInsightResponseDTO> getUnreadInsightsByBaby(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return babyInsightRepository.findByBabyIdAndIsReadFalseOrderByGeneratedAtDescIdDesc(babyId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public BabyInsightResponseDTO markAsRead(String email, Long babyId, Long insightId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        BabyInsight insight = babyInsightRepository.findByIdAndBabyId(insightId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Insight not found: " + insightId));

        insight.setIsRead(true);
        if (insight.getReadAt() == null) {
            insight.setReadAt(LocalDateTime.now());
        }

        return mapToResponse(babyInsightRepository.save(insight));
    }

    @Override
    public BabyInsightResponseDTO dismissInsight(String email, Long babyId, Long insightId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        BabyInsight insight = babyInsightRepository.findByIdAndBabyId(insightId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Insight not found: " + insightId));

        insight.setStatus("DISMISSED");
        insight.setIsRead(true);

        if (insight.getReadAt() == null) {
            insight.setReadAt(LocalDateTime.now());
        }
        insight.setDismissedAt(LocalDateTime.now());

        return mapToResponse(babyInsightRepository.save(insight));
    }

    @Override
    public BabyInsightResponseDTO resolveInsight(String email, Long babyId, Long insightId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        BabyInsight insight = babyInsightRepository.findByIdAndBabyId(insightId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Insight not found: " + insightId));

        insight.setStatus("RESOLVED");
        insight.setIsRead(true);

        if (insight.getReadAt() == null) {
            insight.setReadAt(LocalDateTime.now());
        }
        insight.setResolvedAt(LocalDateTime.now());

        return mapToResponse(babyInsightRepository.save(insight));
    }

    @Override
    public void markAllAsRead(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        List<BabyInsight> insights = babyInsightRepository
                .findByBabyIdAndIsReadFalseOrderByGeneratedAtDescIdDesc(babyId);

        LocalDateTime now = LocalDateTime.now();
        for (BabyInsight insight : insights) {
            insight.setIsRead(true);
            if (insight.getReadAt() == null) {
                insight.setReadAt(now);
            }
        }

        babyInsightRepository.saveAll(insights);
    }

    @Override
    public List<BabyInsightResponseDTO> generateInsightsForBaby(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);

        List<BabyInsight> generated = new ArrayList<>();
        generated.addAll(generateSleepInsights(baby));
        generated.addAll(generateGrowthInsights(baby));
        generated.addAll(generateFeedingInsights(baby));
        generated.addAll(generateDiaperInsights(baby));
        generated.addAll(generateTeethingInsights(baby));
        generated.addAll(generateMilestoneInsights(baby));

        return generated.stream()
                .filter(i -> i != null)
                .map(this::mapToResponse)
                .toList();
    }

    private List<BabyInsight> generateSleepInsights(Baby baby) {
        List<BabyInsight> result = new ArrayList<>();

        LocalDateTime threeDaysAgo = LocalDateTime.now().minusDays(3);
        List<SleepLog> logs = sleepLogRepository.findByBabyIdAndSleepStartAfterOrderBySleepStartDesc(
                baby.getId(), threeDaysAgo
        );

        int totalMinutes = logs.stream()
                .filter(l -> l.getDuration() != null)
                .mapToInt(SleepLog::getDuration)
                .sum();

        if (logs.isEmpty()) {
            result.add(saveInsightIfNotExists(
                    baby,
                    "REMINDER",
                    "No recent sleep records",
                    "No sleep activity has been recorded recently.",
                    "MEDIUM",
                    "SLEEP",
                    "View sleep",
                    "/babies/" + baby.getId() + "/sleep",
                    0.90,
                    "SLEEP_MISSING",
                    "No sleep logs were found in recent days.",
                    "No sleep records found in the last 3 days."
            ));
            return result;
        }

        double averagePerDay = totalMinutes / 3.0;

        if (averagePerDay < 600) {
            result.add(saveInsightIfNotExists(
                    baby,
                    "ATTENTION",
                    "Sleep duration decreased",
                    "The average sleep duration over the last 3 days is below the expected threshold.",
                    "HIGH",
                    "SLEEP",
                    "View sleep",
                    "/babies/" + baby.getId() + "/sleep",
                    0.84,
                    "SLEEP_AVG_LOW_3D",
                    "The average calculated over the last 3 days is below 600 min/day.",
                    "Average sleep: " + Math.round(averagePerDay) + " min/day over 3 days."
            ));
        } else {
            result.add(saveInsightIfNotExists(
                    baby,
                    "TREND",
                    "Sleep pattern looks stable",
                    "Recent sleep records suggest a stable sleep pattern.",
                    "LOW",
                    "SLEEP",
                    "View sleep",
                    "/babies/" + baby.getId() + "/sleep",
                    0.78,
                    "SLEEP_STABLE",
                    "Average sleep remains within the expected range.",
                    "Average sleep: " + Math.round(averagePerDay) + " min/day over 3 days."
            ));
        }

        return result;
    }

    private List<BabyInsight> generateGrowthInsights(Baby baby) {
        List<BabyInsight> result = new ArrayList<>();

        GrowthRecord latest = growthRecordRepository.findFirstByBabyIdOrderByRecordDateDescIdDesc(baby.getId())
                .orElse(null);

        if (latest == null) {
            result.add(saveInsightIfNotExists(
                    baby,
                    "REMINDER",
                    "No growth measurement",
                    "No growth measurement has been recorded for this baby yet.",
                    "MEDIUM",
                    "GROWTH",
                    "Add a measurement",
                    "/babies/" + baby.getId() + "/growth-records",
                    0.95,
                    "GROWTH_MISSING",
                    "No growth record was found.",
                    "No measurement is available in the history."
            ));
            return result;
        }

        if (latest.getRecordDate().isBefore(LocalDate.now().minusDays(30))) {
            result.add(saveInsightIfNotExists(
                    baby,
                    "REMINDER",
                    "Outdated growth measurement",
                    "The last growth measurement was recorded more than 30 days ago.",
                    "MEDIUM",
                    "GROWTH",
                    "Update growth",
                    "/babies/" + baby.getId() + "/growth-records",
                    0.90,
                    "GROWTH_STALE_30D",
                    "The last measurement is older than 30 days.",
                    "Last recorded measurement: " + latest.getRecordDate() + "."
            ));
        } else {
            result.add(saveInsightIfNotExists(
                    baby,
                    "INFO",
                    "Growth tracking is up to date",
                    "Recent growth measurements are being tracked consistently.",
                    "LOW",
                    "GROWTH",
                    "View growth",
                    "/babies/" + baby.getId() + "/growth-records",
                    0.80,
                    "GROWTH_RECENT_OK",
                    "A recent growth record is available.",
                    "Last recorded measurement: " + latest.getRecordDate() + "."
            ));
        }

        return result;
    }

    private List<BabyInsight> generateFeedingInsights(Baby baby) {
        List<BabyInsight> result = new ArrayList<>();

        LocalDate threeDaysAgo = LocalDate.now().minusDays(3);
        List<Feeding> feedings = feedingRepository
                .findByBabyIdAndFeedingDateAfterOrderByFeedingDateDescFeedingTimeDesc(
                        baby.getId(),
                        threeDaysAgo
                );

        if (feedings.isEmpty()) {
            result.add(saveInsightIfNotExists(
                    baby,
                    "REMINDER",
                    "No recent feeding records",
                    "No feeding activity has been recorded recently.",
                    "MEDIUM",
                    "FEEDING",
                    "Add feeding",
                    "/babies/" + baby.getId() + "/feedings",
                    0.90,
                    "FEEDING_MISSING",
                    "No feeding records were found in recent days.",
                    "No feeding logs available in the recent period."
            ));
            return result;
        }

        if (feedings.size() < 3) {
            result.add(saveInsightIfNotExists(
                    baby,
                    "ATTENTION",
                    "Low feeding frequency",
                    "Feeding frequency seems lower than expected.",
                    "HIGH",
                    "FEEDING",
                    "View feedings",
                    "/babies/" + baby.getId() + "/feedings",
                    0.85,
                    "FEEDING_LOW",
                    "Few feeding records were found recently.",
                    "Only " + feedings.size() + " feeding record(s) found in the recent period."
            ));
        }

        Feeding latest = feedingRepository.findFirstByBabyIdOrderByFeedingDateDescFeedingTimeDesc(baby.getId())
                .orElse(null);

        if (latest != null) {
            LocalDate latestDate = latest.getFeedingDate();
            LocalTime latestTime = latest.getFeedingTime();

            if (latestDate != null && latestTime != null) {
                LocalDateTime latestDateTime = LocalDateTime.of(latestDate, latestTime);

                if (latestDateTime.isBefore(LocalDateTime.now().minusHours(8))) {
                    result.add(saveInsightIfNotExists(
                            baby,
                            "ATTENTION",
                            "Long gap since last feeding",
                            "A long time has passed since the latest feeding record.",
                            "HIGH",
                            "FEEDING",
                            "View feedings",
                            "/babies/" + baby.getId() + "/feedings",
                            0.86,
                            "FEEDING_GAP_LONG",
                            "The latest feeding record is older than 8 hours.",
                            "Last feeding recorded at: " + latestDateTime + "."
                    ));
                }
            }
        }

        return result;
    }

    private List<BabyInsight> generateDiaperInsights(Baby baby) {
        List<BabyInsight> result = new ArrayList<>();

        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay().minusNanos(1);

        List<DiaperLog> todayLogs = diaperLogRepository
                .findByBabyIdAndChangeTimeBetweenOrderByChangeTimeDesc(
                        baby.getId(),
                        start,
                        end
                );

        if (todayLogs.isEmpty()) {
            result.add(saveInsightIfNotExists(
                    baby,
                    "REMINDER",
                    "No diaper logs today",
                    "No diaper activity has been recorded today.",
                    "MEDIUM",
                    "DIAPER",
                    "Add diaper log",
                    "/babies/" + baby.getId() + "/diapers",
                    0.90,
                    "DIAPER_NONE_TODAY",
                    "No diaper logs were found for today.",
                    "No diaper entries recorded today."
            ));
            return result;
        }

        if (todayLogs.size() <= 1) {
            result.add(saveInsightIfNotExists(
                    baby,
                    "ATTENTION",
                    "Low diaper activity",
                    "Diaper changes seem lower than usual today.",
                    "HIGH",
                    "DIAPER",
                    "View diaper logs",
                    "/babies/" + baby.getId() + "/diapers",
                    0.85,
                    "DIAPER_LOW",
                    "Very few diaper changes were recorded today.",
                    "Only " + todayLogs.size() + " diaper log(s) found today."
            ));
        } else {
            result.add(saveInsightIfNotExists(
                    baby,
                    "INFO",
                    "Diaper tracking is active",
                    "Diaper activity is being recorded today.",
                    "LOW",
                    "DIAPER",
                    "View diaper logs",
                    "/babies/" + baby.getId() + "/diapers",
                    0.77,
                    "DIAPER_TRACKING_OK",
                    "Multiple diaper logs were recorded today.",
                    todayLogs.size() + " diaper log(s) recorded today."
            ));
        }

        return result;
    }

    private List<BabyInsight> generateTeethingInsights(Baby baby) {
        List<BabyInsight> result = new ArrayList<>();

        TeethingLog latest = teethingLogRepository
                .findFirstByBabyIdOrderByEruptionDateDescIdDesc(baby.getId())
                .orElse(null);

        if (latest == null) {
            return result;
        }

        result.add(saveInsightIfNotExists(
                baby,
                "INFO",
                "Recent teething activity",
                "A recent teething event has been recorded.",
                "LOW",
                "TEETHING",
                "View teething logs",
                "/babies/" + baby.getId() + "/teething",
                0.88,
                "TEETHING_RECENT_EVENT",
                "The latest teething log is available.",
                "Latest tooth recorded: " + latest.getToothLabel() + " on " + latest.getEruptionDate() + "."
        ));

        if (latest.getSymptoms() != null && !latest.getSymptoms().isBlank()) {
            result.add(saveInsightIfNotExists(
                    baby,
                    "INFO",
                    "Teething symptoms logged",
                    "Symptoms have been recorded for the latest teething event.",
                    "LOW",
                    "TEETHING",
                    "View teething logs",
                    "/babies/" + baby.getId() + "/teething",
                    0.82,
                    "TEETHING_SYMPTOMS_LOGGED",
                    "The latest teething log includes symptoms.",
                    "Symptoms: " + latest.getSymptoms() + "."
            ));
        }

        return result;
    }

    private List<BabyInsight> generateMilestoneInsights(Baby baby) {
        List<BabyInsight> result = new ArrayList<>();

        BabyMilestone latest = babyMilestoneRepository
                .findFirstByBabyIdOrderByMilestoneDateDescIdDesc(baby.getId())
                .orElse(null);

        if (latest == null) {
            result.add(saveInsightIfNotExists(
                    baby,
                    "REMINDER",
                    "No milestones recorded",
                    "No milestone has been recorded yet.",
                    "MEDIUM",
                    "MILESTONE",
                    "Add milestone",
                    "/babies/" + baby.getId() + "/milestones",
                    0.95,
                    "MILESTONE_NONE",
                    "No milestone was found.",
                    "No milestone history is available."
            ));
            return result;
        }

        if (latest.getMilestoneDate().isBefore(LocalDate.now().minusDays(30))) {
            result.add(saveInsightIfNotExists(
                    baby,
                    "RECOMMENDATION",
                    "Milestone tracking recommended",
                    "No recent milestone has been recorded.",
                    "MEDIUM",
                    "MILESTONE",
                    "Update milestones",
                    "/babies/" + baby.getId() + "/milestones",
                    0.90,
                    "MILESTONE_OLD",
                    "The latest milestone is older than 30 days.",
                    "Latest milestone date: " + latest.getMilestoneDate() + "."
            ));
        } else {
            result.add(saveInsightIfNotExists(
                    baby,
                    "INFO",
                    "Recent milestone recorded",
                    "A milestone has been recorded recently.",
                    "LOW",
                    "MILESTONE",
                    "View milestones",
                    "/babies/" + baby.getId() + "/milestones",
                    0.88,
                    "MILESTONE_RECENT",
                    "A recent milestone is available.",
                    "Latest milestone: " + latest.getTitle() + " on " + latest.getMilestoneDate() + "."
            ));
        }

        return result;
    }

    private BabyInsight saveInsightIfNotExists(
            Baby baby,
            String insightType,
            String title,
            String message,
            String priority,
            String sourceModule,
            String actionLabel,
            String actionUrl,
            Double confidenceScore,
            String ruleCode,
            String reason,
            String evidenceSummary
    ) {
        BabyInsight existingActive = babyInsightRepository
                .findFirstByBabyIdAndRuleCodeAndStatusOrderByGeneratedAtDescIdDesc(
                        baby.getId(),
                        ruleCode,
                        "ACTIVE"
                )
                .orElse(null);

        if (existingActive != null) {
            return existingActive;
        }

        BabyInsight existingResolved = babyInsightRepository
                .findFirstByBabyIdAndRuleCodeAndStatusOrderByGeneratedAtDescIdDesc(
                        baby.getId(),
                        ruleCode,
                        "RESOLVED"
                )
                .orElse(null);

        if (existingResolved != null) {
            return existingResolved;
        }

        LocalDateTime dismissThreshold = LocalDateTime.now().minusDays(DISMISS_COOLDOWN_DAYS);

        BabyInsight existingRecentDismissed = babyInsightRepository
                .findFirstByBabyIdAndRuleCodeAndStatusAndDismissedAtAfterOrderByDismissedAtDesc(
                        baby.getId(),
                        ruleCode,
                        "DISMISSED",
                        dismissThreshold
                )
                .orElse(null);

        if (existingRecentDismissed != null) {
            return existingRecentDismissed;
        }

        BabyInsight insight = BabyInsight.builder()
                .baby(baby)
                .insightType(insightType)
                .title(title)
                .message(message)
                .priority(priority)
                .sourceModule(sourceModule)
                .isRead(false)
                .status("ACTIVE")
                .actionLabel(actionLabel)
                .actionUrl(actionUrl)
                .confidenceScore(confidenceScore)
                .generatedBy("RULE_ENGINE")
                .ruleCode(ruleCode)
                .reason(reason)
                .evidenceSummary(evidenceSummary)
                .build();

        return babyInsightRepository.save(insight);
    }

    private BabyInsightResponseDTO mapToResponse(BabyInsight insight) {
        return BabyInsightResponseDTO.builder()
                .id(insight.getId())
                .babyId(insight.getBaby().getId())
                .insightType(insight.getInsightType())
                .title(insight.getTitle())
                .message(insight.getMessage())
                .priority(insight.getPriority())
                .sourceModule(insight.getSourceModule())
                .generatedAt(insight.getGeneratedAt())
                .isRead(insight.getIsRead())
                .status(insight.getStatus())
                .actionLabel(insight.getActionLabel())
                .actionUrl(insight.getActionUrl())
                .confidenceScore(insight.getConfidenceScore())
                .generatedBy(insight.getGeneratedBy())
                .ruleCode(insight.getRuleCode())
                .reason(insight.getReason())
                .evidenceSummary(insight.getEvidenceSummary())
                .readAt(insight.getReadAt())
                .dismissedAt(insight.getDismissedAt())
                .resolvedAt(insight.getResolvedAt())
                .build();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Baby getOwnedBabyOrThrow(User currentUser, Long babyId) {
        return babyRepository.findByIdAndMotherId(babyId, currentUser.getId())
                .orElseThrow(() -> new BabyNotFoundException("Baby not found or access denied"));
    }
}