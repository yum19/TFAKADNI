package tn.esprit.backend.module6a.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.module6a.dto.CareScoreResponseDTO;
import tn.esprit.backend.module6a.entity.Baby;
import tn.esprit.backend.module6a.entity.GrowthRecord;
import tn.esprit.backend.module6a.entity.Reminder;
import tn.esprit.backend.module6a.entity.Vaccine;
import tn.esprit.backend.module6a.exception.BabyNotFoundException;
import tn.esprit.backend.module6a.repository.*;
import tn.esprit.backend.module6a.service.ICareScoreService;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CareScoreServiceImpl implements ICareScoreService {

    private static final int FEEDING_MAX_POINTS = 25;
    private static final int SLEEP_MAX_POINTS = 20;
    private static final int DIAPER_MAX_POINTS = 15;
    private static final int GROWTH_MAX_POINTS = 20;
    private static final int VACCINE_MAX_POINTS = 10;
    private static final int REMINDER_MAX_POINTS = 10;

    private final BabyRepository babyRepository;
    private final FeedingRepository feedingRepository;
    private final SleepLogRepository sleepLogRepository;
    private final DiaperLogRepository diaperLogRepository;
    private final GrowthRecordRepository growthRecordRepository;
    private final VaccineRepository vaccineRepository;
    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;

    @Override
    public CareScoreResponseDTO getCareScore(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        LocalDate today = LocalDate.now();
        LocalDate sevenDaysAgo = today.minusDays(7);
        LocalDateTime sevenDaysAgoDateTime = LocalDateTime.now().minusDays(7);

        boolean feedingFollowed = !feedingRepository
                .findByBabyIdAndFeedingDateAfterOrderByFeedingDateDescFeedingTimeDesc(babyId, sevenDaysAgo.minusDays(1))
                .isEmpty();

        boolean sleepFollowed = !sleepLogRepository
                .findByBabyIdAndSleepStartAfterOrderBySleepStartDesc(babyId, sevenDaysAgoDateTime)
                .isEmpty();

        LocalDateTime startOfLast7Days = today.minusDays(7).atStartOfDay();
        LocalDateTime endOfToday = today.plusDays(1).atStartOfDay().minusNanos(1);

        boolean diaperFollowed = !diaperLogRepository
                .findByBabyIdAndChangeTimeBetweenOrderByChangeTimeDesc(babyId, startOfLast7Days, endOfToday)
                .isEmpty();

        GrowthRecord latestGrowth = growthRecordRepository
                .findFirstByBabyIdOrderByRecordDateDescIdDesc(babyId)
                .orElse(null);

        boolean growthUpToDate = latestGrowth != null
                && !latestGrowth.getRecordDate().isBefore(today.minusDays(30));

        List<Vaccine> vaccines = vaccineRepository.findByBabyIdOrderByScheduledDateAscIdAsc(babyId);
        boolean vaccineFollowed = evaluateVaccineFollowUp(vaccines, today);

        List<Reminder> pendingReminders = reminderRepository
                .findByBabyIdAndStatusOrderByReminderDateAscIdAsc(babyId, "PENDING");

        boolean remindersUnderControl = pendingReminders.stream()
                .noneMatch(reminder -> reminder.getReminderDate() != null
                        && reminder.getReminderDate().isBefore(LocalDateTime.now()));

        int feedingPoints = feedingFollowed ? FEEDING_MAX_POINTS : 0;
        int sleepPoints = sleepFollowed ? SLEEP_MAX_POINTS : 0;
        int diaperPoints = diaperFollowed ? DIAPER_MAX_POINTS : 0;
        int growthPoints = growthUpToDate ? GROWTH_MAX_POINTS : 0;
        int vaccinePoints = vaccineFollowed ? VACCINE_MAX_POINTS : 0;
        int reminderPoints = remindersUnderControl ? REMINDER_MAX_POINTS : 0;

        int totalScore = feedingPoints
                + sleepPoints
                + diaperPoints
                + growthPoints
                + vaccinePoints
                + reminderPoints;

        return CareScoreResponseDTO.builder()
                .babyId(babyId)
                .score(totalScore)
                .level(buildLevel(totalScore))
                .explanation(buildExplanation(
                        totalScore,
                        feedingFollowed,
                        sleepFollowed,
                        diaperFollowed,
                        growthUpToDate,
                        vaccineFollowed,
                        remindersUnderControl
                ))
                .feedingFollowed(feedingFollowed)
                .sleepFollowed(sleepFollowed)
                .diaperFollowed(diaperFollowed)
                .growthUpToDate(growthUpToDate)
                .vaccineFollowed(vaccineFollowed)
                .remindersUnderControl(remindersUnderControl)
                .feedingPoints(feedingPoints)
                .sleepPoints(sleepPoints)
                .diaperPoints(diaperPoints)
                .growthPoints(growthPoints)
                .vaccinePoints(vaccinePoints)
                .reminderPoints(reminderPoints)
                .build();
    }

    private boolean evaluateVaccineFollowUp(List<Vaccine> vaccines, LocalDate today) {
        return vaccines.stream()
                .filter(v -> "SCHEDULED".equals(v.getStatus()) || "MISSED".equals(v.getStatus()))
                .noneMatch(v -> v.getScheduledDate() != null && v.getScheduledDate().isBefore(today));
    }

    private String buildLevel(int totalScore) {
        if (totalScore >= 85) return "EXCELLENT";
        if (totalScore >= 65) return "GOOD";
        if (totalScore >= 40) return "MEDIUM";
        return "LOW";
    }

    private String buildExplanation(
            int totalScore,
            boolean feedingFollowed,
            boolean sleepFollowed,
            boolean diaperFollowed,
            boolean growthUpToDate,
            boolean vaccineFollowed,
            boolean remindersUnderControl
    ) {
        return "Score global : " + totalScore
                + ". Feeding suivi: " + feedingFollowed
                + ", sommeil suivi: " + sleepFollowed
                + ", changes suivis: " + diaperFollowed
                + ", croissance à jour: " + growthUpToDate
                + ", vaccins suivis: " + vaccineFollowed
                + ", rappels maîtrisés: " + remindersUnderControl + ".";
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    private Baby getOwnedBabyOrThrow(User currentUser, Long babyId) {
        return babyRepository.findByIdAndMotherId(babyId, currentUser.getId())
                .orElseThrow(() -> new BabyNotFoundException("Bébé introuvable ou accès refusé"));
    }
}