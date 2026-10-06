package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import tn.esprit.backend.entity.*;
import tn.esprit.backend.repository.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final PregnancyRepository pregnancyRepository;
    private final PrenatalExamRepository prenatalExamRepository;
    private final VitalsRepository vitalsRepository;

    private final UserRepository userRepository;

    // ════════════════════════════════════════════════════════
    //   SCHEDULERS
    // ════════════════════════════════════════════════════════

    /** Every day at 8:00 AM — vitals reminder */
    @Scheduled(cron = "0 00 12 * * *")
    public void scheduledVitalsReminder() {
        log.info("[Scheduler] Running daily vitals reminder check for all active mothers");
        List<User> allUsers = userRepository.findAll();
        for (User user : allUsers) {
            // Target only active accounts with the USER role
            if (user.getRole() == User.Role.USER && Boolean.TRUE.equals(user.getIsActive())) {
                checkAndCreateVitalsReminder(user);
            }
        }
    }

    /** Every day at 8:30 AM — exams due this week */
    @Scheduled(cron = "0 00 12 * * *")
    public void scheduledExamsDue() {
        log.info("[Scheduler] Running exams-due-this-week check for all active mothers");
        List<User> allUsers = userRepository.findAll();
        for (User user : allUsers) {
            if (user.getRole() == User.Role.USER && Boolean.TRUE.equals(user.getIsActive())) {
                checkAndCreateExamsDueNotification(user);
            }
        }
    }

    /** Every hour — alert-triggered exams check */
    @Scheduled(cron = "0 0 * * * *")
    public void scheduledAlertTriggered() {
        log.info("[Scheduler] Running alert-triggered exams check for all active mothers");
        List<User> allUsers = userRepository.findAll();
        for (User user : allUsers) {
            if (user.getRole() == User.Role.USER && Boolean.TRUE.equals(user.getIsActive())) {
                checkAndCreateAlertTriggeredNotification(user);
            }
        }
    }

    /** Every night at midnight — cleanup expired notifications */
    @Scheduled(cron = "0 0 0 * * *")
    public void cleanupExpired() {
        notificationRepository.deleteExpired(LocalDateTime.now());
        log.info("[Scheduler] Cleaned up expired notifications");
    }

    // ════════════════════════════════════════════════════════
    //   BUSINESS LOGIC
    // ════════════════════════════════════════════════════════

    /** 💊 1. Vitals reminder — if no vital recorded today */
    public void checkAndCreateVitalsReminder(User user) {
        Long userId = user.getId();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        boolean alreadyExists = notificationRepository.existsTodayByType(
                userId, Notification.NotifType.VITALS_REMINDER, startOfDay);
        if (alreadyExists) return;

        List<Vitals> todayVitals = vitalsRepository
                .findByUserIdOrderByMeasuredAtDesc(userId)
                .stream()
                .filter(v -> v.getMeasuredAt() != null &&
                        v.getMeasuredAt().toLocalDate().equals(LocalDate.now()))
                .toList();

        if (todayVitals.isEmpty()) {
            createNotification(user,
                    Notification.NotifType.VITALS_REMINDER,
                    "Daily vitals reminder 💊",
                    "You haven't recorded your vitals today. Stay on top of your health!",
                    null,
                    LocalDate.now().plusDays(1).atStartOfDay()
            );
        }
    }

    /** 📋 2. Exams due this week */
    public void checkAndCreateExamsDueNotification(User user) {
        Long userId = user.getId();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        boolean alreadyExists = notificationRepository.existsTodayByType(
                userId, Notification.NotifType.EXAM_DUE, startOfDay);
        if (alreadyExists) return;

        List<Pregnancy> pregnancies = pregnancyRepository.findByUserId(userId);

        Pregnancy active = pregnancies.stream()
                .filter(p -> p.getStatus() == Pregnancy.PregnancyStatus.ACTIVE)
                .findFirst().orElse(null);

        if (active == null || active.getLmpDate() == null) return;

        long days = ChronoUnit.DAYS.between(active.getLmpDate(), LocalDate.now());
        int currentWeek = (int) Math.max(1, Math.min(40, days / 7));

        List<PrenatalExam> dueExams = prenatalExamRepository
                .findByPregnancyId(active.getId())
                .stream()
                .filter(e -> !Boolean.TRUE.equals(e.getDone())
                        && e.getRecommendedWeek() != null
                        && e.getRecommendedWeek() == currentWeek
                        && e.getVital() == null)
                .toList();

        if (!dueExams.isEmpty()) {
            String names = dueExams.stream()
                    .limit(2)
                    .map(PrenatalExam::getExamName)
                    .reduce((a, b) -> a + " · " + b)
                    .orElse("");
            if (dueExams.size() > 2) names += " +" + (dueExams.size() - 2) + " more";

            createNotification(user,
                    Notification.NotifType.EXAM_DUE,
                    dueExams.size() + " exam" + (dueExams.size() > 1 ? "s" : "") + " due this week 📋",
                    names.isEmpty() ? "Check your exam schedule." : names,
                    dueExams.size(),
                    LocalDateTime.now().plusDays(7)
            );
        }
    }

    /** 🔔 3. Alert-triggered exams */
    public void checkAndCreateAlertTriggeredNotification(User user) {
        Long userId = user.getId();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        boolean alreadyExists = notificationRepository.existsTodayByType(
                userId, Notification.NotifType.ALERT_TRIGGERED, startOfDay);
        if (alreadyExists) return;

        List<Pregnancy> pregnancies = pregnancyRepository.findByUserId(userId);
        Pregnancy active = pregnancies.stream()
                .filter(p -> p.getStatus() == Pregnancy.PregnancyStatus.ACTIVE)
                .findFirst().orElse(null);

        if (active == null) return;

        List<PrenatalExam> alertExams = prenatalExamRepository
                .findByPregnancyIdAndVitalIsNotNull(active.getId())
                .stream()
                .filter(e -> !Boolean.TRUE.equals(e.getDone()))
                .toList();

        if (!alertExams.isEmpty()) {
            createNotification(user,
                    Notification.NotifType.ALERT_TRIGGERED,
                    alertExams.size() + " urgent exam" + (alertExams.size() > 1 ? "s" : "") + " recommended 🔔",
                    "Based on your recent health alerts. Please consult your doctor.",
                    alertExams.size(),
                    LocalDateTime.now().plusDays(3)
            );
        }
    }

    // ════════════════════════════════════════════════════════
    //   CRUD OPERATIONS (These will still rely on the controller passing the authenticated userId)
    // ════════════════════════════════════════════════════════

    /* public List<Notification> getUnread(Long userId) {
        List<Notification> all = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Notification> unread = notificationRepository.findUnreadByUserId(userId, LocalDateTime.now());
        notificationRepository.deleteAll(all);
        return unread;
    } */

    public List<Notification> getUnread(Long userId) {
        return notificationRepository.findUnreadByUserId(userId, LocalDateTime.now());
    }

    public List<Notification> getAll(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void markAsRead(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    public void markAllAsRead(Long userId) {
        notificationRepository.markAllReadByUserId(userId);
    }

    public void delete(Long id) {
        notificationRepository.deleteById(id);
    }

    // ── Internal helper ──
    private void createNotification(User user, Notification.NotifType type,
                                    String title, String message,
                                    Integer count, LocalDateTime expiresAt) {

        Notification notif = new Notification();
        // Passing the actual robust User entity mapping instead of a spoofed new User()
        notif.setUser(user);
        notif.setType(type);
        notif.setTitle(title);
        notif.setMessage(message);
        notif.setCount(count);
        notif.setExpiresAt(expiresAt);

        notificationRepository.save(notif);
        log.info("[Notification] Created: {} — {} for User ID: {}", type, title, user.getId());
    }
}