package tn.esprit.backend.module6b.service.impl.healing;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.module6b.dto.healing.*;
import tn.esprit.backend.module6b.entity.MoodLog;
import tn.esprit.backend.module6b.entity.PredictionResult;
import tn.esprit.backend.module6b.entity.healing.*;
import tn.esprit.backend.module6b.repository.MoodLogRepository;
import tn.esprit.backend.module6b.repository.PredictionResultRepository;
import tn.esprit.backend.module6b.repository.healing.*;
import tn.esprit.backend.module6b.service.healing.IHealingMissionService;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class HealingMissionServiceImpl implements IHealingMissionService {

    private final HealingMissionRepository healingMissionRepository;
    private final UserMissionProgressRepository userMissionProgressRepository;
    private final HealingBadgeRepository healingBadgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserHealingStatsRepository userHealingStatsRepository;
    private final UserRepository userRepository;
    private final MoodLogRepository moodLogRepository;
    private final PredictionResultRepository predictionResultRepository;

    @Override
    public HealingDashboardResponseDto getDashboard(String email) {
        return HealingDashboardResponseDto.builder()
                .todaysMissions(getTodayMissions(email))
                .recentHistory(getHistory(email).stream().limit(5).toList())
                .latestBadges(getMyBadges(email).stream().limit(4).toList())
                .stats(getStats(email))
                .build();
    }

    @Override
    public List<HealingMissionResponseDto> getAllMissions(String email) {
        User user = getUserByEmail(email);
        return healingMissionRepository.findByActiveTrueOrderByCreatedAtDesc()
                .stream()
                .map(m -> mapMission(user.getId(), m))
                .toList();
    }

    @Override
    public List<HealingMissionResponseDto> getTodayMissions(String email) {
        User user = getUserByEmail(email);
        Long motherId = user.getId();

        List<HealingMission> all = healingMissionRepository.findByActiveTrueOrderByCreatedAtDesc();

        MoodLog latestMood = moodLogRepository.findByMotherIdOrderByLogDateDesc(motherId)
                .stream()
                .findFirst()
                .orElse(null);

        PredictionResult latestPrediction = predictionResultRepository
                .findByScreeningAssessmentMotherIdOrderByPredictionDateDesc(motherId)
                .stream()
                .findFirst()
                .orElse(null);

        List<HealingMission> prioritized = prioritizeMissions(all, latestMood, latestPrediction);

        return prioritized.stream()
                .filter(m -> !isLatestStateCompletedToday(motherId, m.getId()))
                .limit(3)
                .map(m -> mapMission(motherId, m))
                .toList();
    }

    @Override
    public HealingMissionResponseDto getMissionById(String email, Long id) {
        User user = getUserByEmail(email);
        HealingMission mission = getMission(id);
        return mapMission(user.getId(), mission);
    }

    @Override
    public HealingMissionResponseDto startMission(String email, Long missionId) {
        User user = getUserByEmail(email);
        HealingMission mission = getMission(missionId);

        Optional<UserMissionProgress> latest = userMissionProgressRepository
                .findTopByMotherIdAndMissionIdOrderByStartedAtDesc(user.getId(), missionId);

        if (latest.isPresent() && latest.get().getStatus() == MissionStatus.STARTED) {
            return mapMission(user.getId(), mission);
        }

        boolean replayAttempt = userMissionProgressRepository
                .existsByMotherIdAndMissionIdAndStatus(user.getId(), missionId, MissionStatus.COMPLETED);

        UserMissionProgress progress = UserMissionProgress.builder()
                .mother(user)
                .mission(mission)
                .status(MissionStatus.STARTED)
                .startedAt(LocalDateTime.now())
                .pointsEarned(0)
                .replayAttempt(replayAttempt)
                .penaltyApplied(0)
                .build();

        userMissionProgressRepository.save(progress);
        return mapMission(user.getId(), mission, MissionStatus.STARTED);
    }

    @Override
    public HealingMissionCompleteResponseDto completeMission(String email, Long missionId, HealingMissionCompleteRequestDto request) {
        User user = getUserByEmail(email);
        HealingMission mission = getMission(missionId);

        Optional<UserMissionProgress> latestOpt = userMissionProgressRepository
                .findTopByMotherIdAndMissionIdOrderByStartedAtDesc(user.getId(), missionId);

        boolean replayAttempt = userMissionProgressRepository
                .existsByMotherIdAndMissionIdAndStatus(user.getId(), missionId, MissionStatus.COMPLETED);

        UserMissionProgress progress = latestOpt.orElse(
                UserMissionProgress.builder()
                        .mother(user)
                        .mission(mission)
                        .startedAt(LocalDateTime.now())
                        .replayAttempt(replayAttempt)
                        .penaltyApplied(0)
                        .build()
        );

        int earnedPoints = replayAttempt ? 0 : mission.getPointsReward();

        progress.setStatus(MissionStatus.COMPLETED);
        progress.setCompletedAt(LocalDateTime.now());
        progress.setCompletedDate(LocalDate.now());
        progress.setPointsEarned(earnedPoints);
        progress.setNotes(request != null ? request.getNotes() : null);

        if (progress.getReplayAttempt() == null) {
            progress.setReplayAttempt(replayAttempt);
        }
        if (progress.getPenaltyApplied() == null) {
            progress.setPenaltyApplied(0);
        }

        userMissionProgressRepository.save(progress);

        UserHealingStats stats = getOrCreateStats(user);
        updateStatsAfterCompletion(stats, earnedPoints);
        userHealingStatsRepository.save(stats);

        awardBadges(user, stats);

        return HealingMissionCompleteResponseDto.builder()
                .missionId(missionId)
                .message("Mission completed successfully")
                .pointsEarned(earnedPoints)
                .totalPoints(stats.getTotalPoints())
                .currentLevel(stats.getCurrentLevel())
                .currentStreak(stats.getCurrentStreak())
                .build();
    }

    @Override
    public HealingMissionResponseDto failMission(String email, Long missionId) {
        User user = getUserByEmail(email);
        HealingMission mission = getMission(missionId);

        UserMissionProgress progress = userMissionProgressRepository
                .findTopByMotherIdAndMissionIdOrderByCompletedAtDesc(user.getId(), missionId)
                .orElseThrow(() -> new RuntimeException("Mission not started"));

        if (progress.getStatus() == MissionStatus.COMPLETED) {
            int previousPoints = progress.getPointsEarned() != null ? progress.getPointsEarned() : 0;

            UserHealingStats stats = userHealingStatsRepository
                    .findByMotherId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Stats not found"));

            stats.setCoins(Math.max(0, stats.getCoins() - previousPoints));
            stats.setTotalPoints(Math.max(0, stats.getTotalPoints() - previousPoints));
            stats.setCurrentLevel(1 + (stats.getTotalPoints() / 100));

            userHealingStatsRepository.save(stats);
        }

        progress.setStatus(MissionStatus.FAILED);
        progress.setCompletedAt(LocalDateTime.now());
        progress.setCompletedDate(LocalDate.now());
        progress.setPointsEarned(0);

        userMissionProgressRepository.save(progress);

        return mapMission(user.getId(), mission);
    }

    @Override
    public HealingMissionResponseDto skipMission(String email, Long missionId) {
        User user = getUserByEmail(email);
        HealingMission mission = getMission(missionId);

        UserMissionProgress progress = UserMissionProgress.builder()
                .mother(user)
                .mission(mission)
                .status(MissionStatus.SKIPPED)
                .startedAt(LocalDateTime.now())
                .completedAt(LocalDateTime.now())
                .completedDate(LocalDate.now())
                .pointsEarned(0)
                .replayAttempt(false)
                .penaltyApplied(0)
                .build();

        userMissionProgressRepository.save(progress);
        return mapMission(user.getId(), mission, MissionStatus.SKIPPED);
    }

    @Override
    public List<HealingMissionResponseDto> getHistory(String email) {
        User user = getUserByEmail(email);

        return userMissionProgressRepository.findByMotherIdOrderByStartedAtDesc(user.getId())
                .stream()
                .map(UserMissionProgress::getMission)
                .distinct()
                .map(m -> mapMission(user.getId(), m))
                .toList();
    }

    @Override
    public HealingStatsResponseDto getStats(String email) {
        User user = getUserByEmail(email);
        UserHealingStats stats = getOrCreateStats(user);

        int nextLevelThreshold = stats.getCurrentLevel() * 100;
        int pointsToNext = Math.max(0, nextLevelThreshold - stats.getTotalPoints());

        return HealingStatsResponseDto.builder()
                .coins(stats.getCoins())
                .totalPoints(stats.getTotalPoints())
                .currentLevel(stats.getCurrentLevel())
                .currentStreak(stats.getCurrentStreak())
                .longestStreak(stats.getLongestStreak())
                .completedMissionsCount(stats.getCompletedMissionsCount())
                .pointsToNextLevel(pointsToNext)
                .build();
    }

    @Override
    public List<HealingBadgeResponseDto> getAllBadges(String email) {
        User user = getUserByEmail(email);
        List<UserBadge> myBadges = userBadgeRepository.findByMotherIdOrderByEarnedAtDesc(user.getId());

        Map<Long, UserBadge> earnedMap = myBadges.stream()
                .collect(Collectors.toMap(ub -> ub.getBadge().getId(), ub -> ub, (a, b) -> a));

        return healingBadgeRepository.findAll()
                .stream()
                .map(badge -> HealingBadgeResponseDto.builder()
                        .id(badge.getId())
                        .name(badge.getName())
                        .description(badge.getDescription())
                        .icon(badge.getIcon())
                        .badgeType(badge.getBadgeType().name())
                        .earned(earnedMap.containsKey(badge.getId()))
                        .earnedAt(earnedMap.containsKey(badge.getId()) ? earnedMap.get(badge.getId()).getEarnedAt().toString() : null)
                        .build())
                .toList();
    }

    @Override
    public List<HealingBadgeResponseDto> getMyBadges(String email) {
        User user = getUserByEmail(email);

        return userBadgeRepository.findByMotherIdOrderByEarnedAtDesc(user.getId())
                .stream()
                .map(ub -> HealingBadgeResponseDto.builder()
                        .id(ub.getBadge().getId())
                        .name(ub.getBadge().getName())
                        .description(ub.getBadge().getDescription())
                        .icon(ub.getBadge().getIcon())
                        .badgeType(ub.getBadge().getBadgeType().name())
                        .earned(true)
                        .earnedAt(ub.getEarnedAt().toString())
                        .build())
                .toList();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    private HealingMission getMission(Long id) {
        return healingMissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Healing mission not found with id: " + id));
    }

    private UserHealingStats getOrCreateStats(User user) {
        return userHealingStatsRepository.findByMotherId(user.getId())
                .orElseGet(() -> userHealingStatsRepository.save(
                        UserHealingStats.builder()
                                .mother(user)
                                .coins(0)
                                .totalPoints(0)
                                .currentLevel(1)
                                .currentStreak(0)
                                .longestStreak(0)
                                .completedMissionsCount(0)
                                .build()
                ));
    }

    private void updateStatsAfterCompletion(UserHealingStats stats, int points) {
        if (stats.getTotalPoints() == null) {
            stats.setTotalPoints(0);
        }
        if (stats.getCompletedMissionsCount() == null) {
            stats.setCompletedMissionsCount(0);
        }
        if (stats.getCurrentStreak() == null) {
            stats.setCurrentStreak(0);
        }
        if (stats.getLongestStreak() == null) {
            stats.setLongestStreak(0);
        }
        if (stats.getCurrentLevel() == null || stats.getCurrentLevel() < 1) {
            stats.setCurrentLevel(1);
        }

        stats.setCoins(stats.getCoins() + points);
        stats.setTotalPoints(stats.getTotalPoints() + points);
        stats.setCompletedMissionsCount(stats.getCompletedMissionsCount() + 1);

        LocalDate today = LocalDate.now();
        LocalDate lastDate = stats.getLastCompletedMissionDate();

        if (lastDate == null) {
            stats.setCurrentStreak(1);
        } else if (lastDate.equals(today.minusDays(1))) {
            stats.setCurrentStreak(stats.getCurrentStreak() + 1);
        } else if (!lastDate.equals(today)) {
            stats.setCurrentStreak(1);
        }

        stats.setLastCompletedMissionDate(today);

        if (stats.getCurrentStreak() > stats.getLongestStreak()) {
            stats.setLongestStreak(stats.getCurrentStreak());
        }

        stats.setCurrentLevel(1 + (stats.getTotalPoints() / 100));
    }

    private void applyReplayFailurePenalty(UserHealingStats stats, int penalty) {
        stats.setTotalPoints(Math.max(0, stats.getTotalPoints() - penalty));
        stats.setCurrentLevel(1 + (stats.getTotalPoints() / 100));
    }

    private void awardBadges(User user, UserHealingStats stats) {
        awardBadgeIfNeeded(user, BadgeType.FIRST_STEP, stats.getCompletedMissionsCount() >= 1);
        awardBadgeIfNeeded(user, BadgeType.SELF_CARE_BLOOM, stats.getCompletedMissionsCount() >= 10);
        awardBadgeIfNeeded(user, BadgeType.HEALING_STREAK, stats.getCurrentStreak() >= 3);

        long breathingCompleted = userMissionProgressRepository.countByMotherIdAndMission_MissionTypeAndStatus(
                user.getId(), MissionType.BREATHING, MissionStatus.COMPLETED);
        awardBadgeIfNeeded(user, BadgeType.BREATHING_MASTER, breathingCompleted >= 3);

        long gratitudeCompleted = userMissionProgressRepository.countByMotherIdAndMission_MissionTypeAndStatus(
                user.getId(), MissionType.GRATITUDE, MissionStatus.COMPLETED);
        awardBadgeIfNeeded(user, BadgeType.GRATITUDE_SPARK, gratitudeCompleted >= 5);

        long voiceCompleted = userMissionProgressRepository.countByMotherIdAndMission_MissionTypeAndStatus(
                user.getId(), MissionType.VOICE_COMFORT, MissionStatus.COMPLETED);
        awardBadgeIfNeeded(user, BadgeType.VOICE_GENTLE, voiceCompleted >= 3);
    }

    private void awardBadgeIfNeeded(User user, BadgeType badgeType, boolean conditionMet) {
        if (!conditionMet) return;

        HealingBadge badge = healingBadgeRepository.findByBadgeType(badgeType).orElse(null);
        if (badge == null) return;

        if (userBadgeRepository.existsByMotherIdAndBadge_Id(user.getId(), badge.getId())) {
            return;
        }

        UserBadge userBadge = UserBadge.builder()
                .mother(user)
                .badge(badge)
                .earnedAt(LocalDateTime.now())
                .build();

        userBadgeRepository.save(userBadge);
    }

    private List<HealingMission> prioritizeMissions(
            List<HealingMission> all,
            MoodLog latestMood,
            PredictionResult latestPrediction
    ) {
        String emotion = latestMood != null && latestMood.getEmotionType() != null
                ? latestMood.getEmotionType().toUpperCase()
                : "";

        String risk = latestPrediction != null && latestPrediction.getRiskLevel() != null
                ? latestPrediction.getRiskLevel().toUpperCase()
                : "";

        Comparator<HealingMission> comparator = Comparator.comparingInt(mission -> {
            int score = 100;

            if ("ANXIOUS".equals(emotion)) {
                if (mission.getMissionType() == MissionType.BREATHING) score -= 50;
                if (mission.getMissionType() == MissionType.CALM_AUDIO) score -= 40;
            }

            if ("HIGH".equals(risk)) {
                if (mission.getDifficulty() == MissionDifficulty.SOFT) score -= 35;
                if (mission.getMissionType() == MissionType.GRATITUDE) score -= 20;
            }

            if (latestMood != null && latestMood.getMoodScore() <= 4) {
                if (mission.getMissionType() == MissionType.GRATITUDE) score -= 35;
                if (mission.getMissionType() == MissionType.VOICE_COMFORT) score -= 25;
            }

            return score;
        });

        return all.stream().sorted(comparator).toList();
    }

    private boolean isLatestStateCompletedToday(Long motherId, Long missionId) {
        Optional<UserMissionProgress> latest = userMissionProgressRepository
                .findTopByMotherIdAndMissionIdOrderByCompletedAtDesc(motherId, missionId);

        return latest.isPresent()
                && latest.get().getStatus() == MissionStatus.COMPLETED
                && LocalDate.now().equals(latest.get().getCompletedDate());
    }

    private HealingMissionResponseDto mapMission(Long motherId, HealingMission mission) {
        Optional<UserMissionProgress> progress =
                userMissionProgressRepository
                        .findTopByMotherIdAndMissionIdOrderByCompletedAtDesc(motherId, mission.getId());

        MissionStatus status = progress
                .map(UserMissionProgress::getStatus)
                .orElse(MissionStatus.AVAILABLE);

        boolean completedToday = progress.isPresent()
                && progress.get().getStatus() == MissionStatus.COMPLETED
                && LocalDate.now().equals(progress.get().getCompletedDate());

        return HealingMissionResponseDto.builder()
                .id(mission.getId())
                .title(mission.getTitle())
                .description(mission.getDescription())
                .missionType(mission.getMissionType())
                .difficulty(mission.getDifficulty())
                .pointsReward(mission.getPointsReward())
                .durationSeconds(mission.getDurationSeconds())
                .mediaUrl(mission.getMediaUrl())
                .thumbnailUrl(mission.getThumbnailUrl())
                .status(status)
                .completedToday(completedToday)
                .build();
    }

    private HealingMissionResponseDto mapMission(Long motherId, HealingMission mission, MissionStatus forcedStatus) {
        Optional<UserMissionProgress> progress =
                userMissionProgressRepository
                        .findTopByMotherIdAndMissionIdOrderByCompletedAtDesc(motherId, mission.getId());

        boolean completedToday = progress.isPresent()
                && progress.get().getStatus() == MissionStatus.COMPLETED
                && LocalDate.now().equals(progress.get().getCompletedDate());

        return HealingMissionResponseDto.builder()
                .id(mission.getId())
                .title(mission.getTitle())
                .description(mission.getDescription())
                .missionType(mission.getMissionType())
                .difficulty(mission.getDifficulty())
                .pointsReward(mission.getPointsReward())
                .durationSeconds(mission.getDurationSeconds())
                .mediaUrl(mission.getMediaUrl())
                .thumbnailUrl(mission.getThumbnailUrl())
                .status(forcedStatus)
                .completedToday(completedToday)
                .expectedText(mission.getExpectedText())
                .expectedVoiceStyle(mission.getExpectedVoiceStyle() != null ? mission.getExpectedVoiceStyle().name() : null)
                .minimumPassingScore(mission.getMinimumPassingScore())
                .build();
    }
}