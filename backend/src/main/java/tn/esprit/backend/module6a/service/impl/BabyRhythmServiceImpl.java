package tn.esprit.backend.module6a.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.module6a.dto.BabyPredictionResponseDTO;
import tn.esprit.backend.module6a.dto.BabyRhythmProfileResponseDTO;
import tn.esprit.backend.module6a.entity.Baby;
import tn.esprit.backend.module6a.entity.BabyRhythmProfile;
import tn.esprit.backend.module6a.entity.Feeding;
import tn.esprit.backend.module6a.entity.SleepLog;
import tn.esprit.backend.module6a.exception.BabyNotFoundException;
import tn.esprit.backend.module6a.repository.BabyRepository;
import tn.esprit.backend.module6a.repository.BabyRhythmProfileRepository;
import tn.esprit.backend.module6a.repository.FeedingRepository;
import tn.esprit.backend.module6a.repository.SleepLogRepository;
import tn.esprit.backend.module6a.service.IBabyRhythmService;
import tn.esprit.backend.repository.UserRepository;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BabyRhythmServiceImpl implements IBabyRhythmService {

    private static final int ANALYSIS_DAYS = 14;
    private static final int MAX_VALID_FEEDING_INTERVAL_MINUTES = 720;

    private final BabyRepository babyRepository;
    private final BabyRhythmProfileRepository babyRhythmProfileRepository;
    private final FeedingRepository feedingRepository;
    private final SleepLogRepository sleepLogRepository;
    private final UserRepository userRepository;

    @Override
    public BabyRhythmProfileResponseDTO recalculateRhythmProfile(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        BabyRhythmProfile profile = buildAndSaveRhythmProfile(babyId);
        RhythmAnalysisData data = loadAnalysisData(babyId);

        return mapToResponse(profile, data.feedings(), data.sleepLogs());
    }

    @Override
    public void recalculateRhythmProfileByBabyId(Long babyId) {
        Baby baby = babyRepository.findById(babyId)
                .orElseThrow(() -> new BabyNotFoundException("Baby not found"));
        buildAndSaveRhythmProfile(baby.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public BabyRhythmProfileResponseDTO getRhythmProfile(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        RhythmAnalysisData data = loadAnalysisData(babyId);

        BabyRhythmProfile profile = babyRhythmProfileRepository.findByBabyId(babyId)
                .orElseGet(() -> buildAndSaveRhythmProfile(babyId));

        return mapToResponse(profile, data.feedings(), data.sleepLogs());
    }

    @Override
    @Transactional(readOnly = true)
    public BabyPredictionResponseDTO predictNextFeeding(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        RhythmAnalysisData data = loadAnalysisData(babyId);
        List<Feeding> feedings = data.feedings();

        Integer averageInterval = calculateAverageFeedingInterval(feedings);
        LocalDateTime predictedDateTime = null;

        if (averageInterval != null && !feedings.isEmpty()) {
            LocalDateTime lastFeedingDateTime = toFeedingDateTime(feedings.get(feedings.size() - 1));
            predictedDateTime = lastFeedingDateTime.plusMinutes(averageInterval);
        }

        return BabyPredictionResponseDTO.builder()
                .babyId(babyId)
                .predictionType("NEXT_FEEDING")
                .predictedDateTime(predictedDateTime)
                .confidenceScore(buildConfidenceFromCount(feedings.size()))
                .explanation(
                        predictedDateTime != null
                                ? "Prediction based on the average interval between feedings observed over the last "
                                + ANALYSIS_DAYS + " days."
                                : "Not enough valid feeding data to calculate the next feeding prediction."
                )
                .basedOnDays(ANALYSIS_DAYS)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BabyPredictionResponseDTO predictNextSleep(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        RhythmAnalysisData data = loadAnalysisData(babyId);
        List<SleepLog> sleepLogs = data.sleepLogs();

        LocalTime usualNapTime = calculateUsualNapTime(sleepLogs);
        LocalDateTime predictedDateTime = null;

        if (usualNapTime != null) {
            LocalDateTime now = LocalDateTime.now();
            predictedDateTime = now.toLocalTime().isBefore(usualNapTime)
                    ? LocalDateTime.of(LocalDate.now(), usualNapTime)
                    : LocalDateTime.of(LocalDate.now().plusDays(1), usualNapTime);
        } else if (!sleepLogs.isEmpty()) {
            SleepLog latestSleep = sleepLogs.get(sleepLogs.size() - 1);
            if (latestSleep.getSleepEnd() != null) {
                predictedDateTime = latestSleep.getSleepEnd().plusHours(3);
            }
        }

        return BabyPredictionResponseDTO.builder()
                .babyId(babyId)
                .predictionType("NEXT_SLEEP")
                .predictedDateTime(predictedDateTime)
                .confidenceScore(buildConfidenceFromCount(sleepLogs.size()))
                .explanation(
                        predictedDateTime != null
                                ? "Prediction based on naps and sleep patterns observed over the last "
                                + ANALYSIS_DAYS + " days."
                                : "Not enough sleep data to calculate the next sleep prediction."
                )
                .basedOnDays(ANALYSIS_DAYS)
                .build();
    }

    private BabyRhythmProfile buildAndSaveRhythmProfile(Long babyId) {
        Baby baby = babyRepository.findById(babyId)
                .orElseThrow(() -> new BabyNotFoundException("Baby not found"));

        RhythmAnalysisData data = loadAnalysisData(babyId);

        Integer averageFeedingInterval = calculateAverageFeedingInterval(data.feedings());
        Integer averageSleepDuration = calculateAverageSleepDuration(data.sleepLogs());
        LocalTime usualMorningWakeTime = calculateUsualMorningWakeTime(data.sleepLogs());
        LocalTime usualNapTime = calculateUsualNapTime(data.sleepLogs());
        LocalTime usualBedtime = calculateUsualBedtime(data.sleepLogs());
        Integer nightWakeFrequency = calculateNightWakeFrequency(data.sleepLogs());
        Integer rhythmStabilityScore = calculateRhythmStability(
                data.feedings(),
                data.sleepLogs(),
                averageFeedingInterval,
                averageSleepDuration
        );

        BabyRhythmProfile profile = babyRhythmProfileRepository.findByBabyId(babyId)
                .orElse(BabyRhythmProfile.builder().baby(baby).build());

        profile.setAverageFeedingIntervalMinutes(averageFeedingInterval);
        profile.setAverageSleepDurationMinutes(averageSleepDuration);
        profile.setUsualMorningWakeTime(usualMorningWakeTime);
        profile.setUsualNapTime(usualNapTime);
        profile.setUsualBedtime(usualBedtime);
        profile.setNightWakeFrequency(nightWakeFrequency);
        profile.setRhythmStabilityScore(rhythmStabilityScore);
        profile.setLastCalculatedAt(LocalDateTime.now());

        return babyRhythmProfileRepository.save(profile);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private RhythmAnalysisData loadAnalysisData(Long babyId) {
        LocalDate since = LocalDate.now().minusDays(ANALYSIS_DAYS);

        List<Feeding> feedings = feedingRepository
                .findByBabyIdAndFeedingDateAfterOrderByFeedingDateDescFeedingTimeDesc(babyId, since.minusDays(1))
                .stream()
                .sorted(Comparator.comparing(this::toFeedingDateTime))
                .toList();

        List<SleepLog> sleepLogs = sleepLogRepository
                .findByBabyIdAndSleepStartAfterOrderBySleepStartDesc(
                        babyId,
                        LocalDateTime.now().minusDays(ANALYSIS_DAYS)
                )
                .stream()
                .sorted(Comparator.comparing(SleepLog::getSleepStart))
                .toList();

        return new RhythmAnalysisData(feedings, sleepLogs);
    }

    private Integer calculateAverageFeedingInterval(List<Feeding> feedings) {
        if (feedings == null || feedings.size() < 2) {
            return null;
        }

        long total = 0;
        int count = 0;

        for (int i = 1; i < feedings.size(); i++) {
            LocalDateTime previous = toFeedingDateTime(feedings.get(i - 1));
            LocalDateTime current = toFeedingDateTime(feedings.get(i));

            long interval = Duration.between(previous, current).toMinutes();

            if (interval > 0 && interval <= MAX_VALID_FEEDING_INTERVAL_MINUTES) {
                total += interval;
                count++;
            }
        }

        return count == 0 ? null : (int) Math.round((double) total / count);
    }

    private Integer calculateAverageSleepDuration(List<SleepLog> sleepLogs) {
        if (sleepLogs == null || sleepLogs.isEmpty()) {
            return null;
        }

        double average = sleepLogs.stream()
                .map(SleepLog::getDuration)
                .filter(duration -> duration != null && duration > 0)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0);

        return average == 0 ? null : (int) Math.round(average);
    }

    private LocalTime calculateUsualMorningWakeTime(List<SleepLog> sleepLogs) {
        return averageLocalTime(
                sleepLogs.stream()
                        .map(SleepLog::getSleepEnd)
                        .filter(value -> value != null)
                        .map(LocalDateTime::toLocalTime)
                        .filter(time -> !time.isBefore(LocalTime.of(4, 0)) && time.isBefore(LocalTime.of(11, 0)))
                        .toList()
        );
    }

    private LocalTime calculateUsualNapTime(List<SleepLog> sleepLogs) {
        return averageLocalTime(
                sleepLogs.stream()
                        .map(SleepLog::getSleepStart)
                        .filter(value -> value != null)
                        .map(LocalDateTime::toLocalTime)
                        .filter(time -> !time.isBefore(LocalTime.of(10, 0)) && time.isBefore(LocalTime.of(17, 0)))
                        .toList()
        );
    }

    private LocalTime calculateUsualBedtime(List<SleepLog> sleepLogs) {
        return averageLocalTime(
                sleepLogs.stream()
                        .map(SleepLog::getSleepStart)
                        .filter(value -> value != null)
                        .map(LocalDateTime::toLocalTime)
                        .filter(time -> !time.isBefore(LocalTime.of(18, 0)))
                        .toList()
        );
    }

    private LocalTime averageLocalTime(List<LocalTime> times) {
        if (times == null || times.isEmpty()) {
            return null;
        }

        double averageSeconds = times.stream()
                .mapToInt(LocalTime::toSecondOfDay)
                .average()
                .orElse(-1);

        if (averageSeconds < 0) {
            return null;
        }

        return LocalTime.ofSecondOfDay((long) averageSeconds);
    }

    private Integer calculateNightWakeFrequency(List<SleepLog> sleepLogs) {
        if (sleepLogs == null || sleepLogs.isEmpty()) {
            return 0;
        }

        long nightStarts = sleepLogs.stream()
                .map(SleepLog::getSleepStart)
                .filter(value -> value != null)
                .map(LocalDateTime::toLocalTime)
                .filter(time -> !time.isBefore(LocalTime.MIDNIGHT) && time.isBefore(LocalTime.of(6, 0)))
                .count();

        return (int) nightStarts;
    }

    private Integer calculateRhythmStability(
            List<Feeding> feedings,
            List<SleepLog> sleepLogs,
            Integer averageFeedingInterval,
            Integer averageSleepDuration
    ) {
        int score = 100;

        if (averageFeedingInterval == null) {
            score -= 30;
        }

        if (averageSleepDuration == null) {
            score -= 30;
        }

        if (feedings == null || feedings.size() < 3) {
            score -= 20;
        }

        if (sleepLogs == null || sleepLogs.size() < 2) {
            score -= 20;
        }

        return Math.max(0, score);
    }

    private BabyRhythmProfileResponseDTO mapToResponse(
            BabyRhythmProfile profile,
            List<Feeding> feedings,
            List<SleepLog> sleepLogs
    ) {
        LocalDateTime predictedNextFeeding = null;
        LocalDateTime predictedNextSleep = null;

        Integer avgFeed = profile.getAverageFeedingIntervalMinutes();
        if (avgFeed != null && feedings != null && !feedings.isEmpty()) {
            predictedNextFeeding = toFeedingDateTime(feedings.get(feedings.size() - 1)).plusMinutes(avgFeed);
        }

        LocalTime nap = profile.getUsualNapTime();
        if (nap != null) {
            LocalDateTime now = LocalDateTime.now();
            predictedNextSleep = now.toLocalTime().isBefore(nap)
                    ? LocalDateTime.of(LocalDate.now(), nap)
                    : LocalDateTime.of(LocalDate.now().plusDays(1), nap);
        } else if (sleepLogs != null && !sleepLogs.isEmpty()) {
            SleepLog latestSleep = sleepLogs.get(sleepLogs.size() - 1);
            if (latestSleep.getSleepEnd() != null) {
                predictedNextSleep = latestSleep.getSleepEnd().plusHours(3);
            }
        }

        return BabyRhythmProfileResponseDTO.builder()
                .id(profile.getId())
                .babyId(profile.getBaby().getId())
                .averageFeedingIntervalMinutes(profile.getAverageFeedingIntervalMinutes())
                .averageSleepDurationMinutes(profile.getAverageSleepDurationMinutes())
                .usualMorningWakeTime(profile.getUsualMorningWakeTime())
                .usualNapTime(profile.getUsualNapTime())
                .usualBedtime(profile.getUsualBedtime())
                .nightWakeFrequency(profile.getNightWakeFrequency())
                .rhythmStabilityScore(profile.getRhythmStabilityScore())
                .predictedNextFeeding(predictedNextFeeding)
                .predictedNextSleep(predictedNextSleep)
                .rhythmLabel(buildRhythmLabel(profile.getRhythmStabilityScore()))
                .explanation(buildRhythmExplanation())
                .lastCalculatedAt(profile.getLastCalculatedAt())
                .build();
    }

    private String buildRhythmLabel(Integer stabilityScore) {
        if (stabilityScore == null) return "UNKNOWN";
        if (stabilityScore >= 80) return "STABLE";
        if (stabilityScore >= 50) return "MODERATE";
        return "IRREGULAR";
    }

    private String buildRhythmExplanation() {
        return "Rhythm analysis based on feedings and sleep periods observed over the last "
                + ANALYSIS_DAYS + " days.";
    }

    private int buildConfidenceFromCount(int count) {
        return Math.min(95, Math.max(20, 40 + count * 8));
    }

    private LocalDateTime toFeedingDateTime(Feeding feeding) {
        return LocalDateTime.of(feeding.getFeedingDate(), feeding.getFeedingTime());
    }

    private Baby getOwnedBabyOrThrow(User currentUser, Long babyId) {
        return babyRepository.findByIdAndMotherId(babyId, currentUser.getId())
                .orElseThrow(() -> new BabyNotFoundException("Baby not found or access denied"));
    }

    private record RhythmAnalysisData(List<Feeding> feedings, List<SleepLog> sleepLogs) {
    }
}