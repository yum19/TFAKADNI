package tn.esprit.backend.module6a.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.module6a.dto.TodaySummaryResponseDTO;
import tn.esprit.backend.module6a.entity.*;
import tn.esprit.backend.module6a.exception.BabyNotFoundException;
import tn.esprit.backend.module6a.repository.*;
import tn.esprit.backend.module6a.service.ITodaySummaryService;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TodaySummaryServiceImpl implements ITodaySummaryService {

    private final BabyRepository babyRepository;
    private final FeedingRepository feedingRepository;
    private final SleepLogRepository sleepLogRepository;
    private final DiaperLogRepository diaperLogRepository;
    private final VaccineRepository vaccineRepository;
    private final BabyAppointmentRepository babyAppointmentRepository;
    private final ReminderRepository reminderRepository;
    private final BabyInsightRepository babyInsightRepository;
    private final UserRepository userRepository;

    @Override
    public TodaySummaryResponseDTO getTodaySummary(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay().minusNanos(1);

        List<Feeding> todayFeedings = feedingRepository
                .findByBabyIdOrderByFeedingDateDescFeedingTimeDesc(babyId)
                .stream()
                .filter(feeding -> feeding.getFeedingDate() != null && feeding.getFeedingDate().isEqual(today))
                .toList();

        List<SleepLog> todaySleepLogs = sleepLogRepository
                .findByBabyIdOrderBySleepStartDesc(babyId)
                .stream()
                .filter(log -> log.getSleepStart() != null)
                .filter(log -> !log.getSleepStart().isBefore(startOfDay) && !log.getSleepStart().isAfter(endOfDay))
                .toList();

        List<DiaperLog> todayDiaperLogs = diaperLogRepository
                .findByBabyIdAndChangeTimeBetweenOrderByChangeTimeDesc(babyId, startOfDay, endOfDay);

        List<Vaccine> todayVaccines = vaccineRepository
                .findByBabyIdOrderByScheduledDateAscIdAsc(babyId)
                .stream()
                .filter(vaccine -> (
                        vaccine.getTakenDate() != null && vaccine.getTakenDate().isEqual(today)
                ) || (
                        vaccine.getTakenDate() == null
                                && vaccine.getScheduledDate() != null
                                && vaccine.getScheduledDate().isEqual(today)
                ))
                .toList();

        List<BabyAppointment> todayAppointments = babyAppointmentRepository
                .findByBabyIdOrderByAppointmentDateDescIdDesc(babyId)
                .stream()
                .filter(appointment -> appointment.getAppointmentDate() != null)
                .filter(appointment -> appointment.getAppointmentDate().toLocalDate().isEqual(today))
                .toList();

        List<Reminder> todayReminders = reminderRepository
                .findByBabyIdAndReminderDateBetweenOrderByReminderDateAscIdAsc(babyId, startOfDay, endOfDay);

        List<BabyInsight> unreadInsights = babyInsightRepository
                .findByBabyIdAndIsReadFalseOrderByGeneratedAtDescIdDesc(babyId);

        int feedingCount = todayFeedings.size();
        double totalFeedingQuantity = round(
                todayFeedings.stream()
                        .map(Feeding::getQuantity)
                        .filter(quantity -> quantity != null && quantity > 0)
                        .mapToDouble(Double::doubleValue)
                        .sum()
        );

        int sleepCount = todaySleepLogs.size();
        int totalSleepMinutes = todaySleepLogs.stream()
                .map(SleepLog::getDuration)
                .filter(duration -> duration != null && duration > 0)
                .mapToInt(Integer::intValue)
                .sum();

        int diaperCount = todayDiaperLogs.size();
        boolean attentionNeeded = computeAttentionNeeded(todayReminders, unreadInsights);

        String summaryTitle = buildSummaryTitle(feedingCount, totalSleepMinutes, diaperCount, attentionNeeded);
        String summaryText = buildSummaryText(
                today,
                feedingCount,
                totalFeedingQuantity,
                sleepCount,
                totalSleepMinutes,
                diaperCount,
                todayVaccines.size(),
                todayAppointments.size(),
                todayReminders.size(),
                unreadInsights.size(),
                attentionNeeded
        );

        return TodaySummaryResponseDTO.builder()
                .babyId(babyId)
                .date(today.toString())
                .feedingCount(feedingCount)
                .totalFeedingQuantity(totalFeedingQuantity)
                .sleepCount(sleepCount)
                .totalSleepMinutes(totalSleepMinutes)
                .diaperCount(diaperCount)
                .vaccineCountToday(todayVaccines.size())
                .appointmentCountToday(todayAppointments.size())
                .reminderCountToday(todayReminders.size())
                .unreadInsightCount(unreadInsights.size())
                .attentionNeeded(attentionNeeded)
                .summaryTitle(summaryTitle)
                .summaryText(summaryText)
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

    private boolean computeAttentionNeeded(List<Reminder> todayReminders, List<BabyInsight> unreadInsights) {
        boolean overdueReminder = todayReminders.stream()
                .anyMatch(r -> r.getReminderDate() != null && r.getReminderDate().isBefore(LocalDateTime.now()));

        boolean highPriorityInsight = unreadInsights.stream()
                .anyMatch(i -> "HIGH".equals(i.getPriority()) || "ATTENTION".equals(i.getInsightType()));

        return overdueReminder || highPriorityInsight;
    }

    private String buildSummaryTitle(int feedingCount, int totalSleepMinutes, int diaperCount, boolean attentionNeeded) {
        if (attentionNeeded) {
            return "Day requires attention";
        }
        if (feedingCount == 0 && totalSleepMinutes == 0 && diaperCount == 0) {
            return "No activity recorded today";
        }
        return "Daily baby summary";
    }

    private String buildSummaryText(
            LocalDate today,
            int feedingCount,
            double totalFeedingQuantity,
            int sleepCount,
            int totalSleepMinutes,
            int diaperCount,
            int vaccineCountToday,
            int appointmentCountToday,
            int reminderCountToday,
            int unreadInsightCount,
            boolean attentionNeeded
    ) {
        return "On " + today + ", the baby had " + feedingCount + " feedings totaling "
                + totalFeedingQuantity + " ml, " + sleepCount + " sleep sessions totaling "
                + totalSleepMinutes + " minutes, and " + diaperCount + " diaper changes. "
                + "Vaccines today: " + vaccineCountToday + ", appointments today: " + appointmentCountToday
                + ", reminders today: " + reminderCountToday + ", unread insights: " + unreadInsightCount
                + ". Attention needed: " + (attentionNeeded ? "yes" : "no") + ".";
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}