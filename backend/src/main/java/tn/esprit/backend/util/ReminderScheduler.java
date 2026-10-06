package tn.esprit.backend.util;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import tn.esprit.backend.entity.PartnerNotification;
import tn.esprit.backend.enumtype.NotificationType;
import tn.esprit.backend.repository.PartnerNotificationRepository;
import tn.esprit.backend.repository.PregnancyRepository;
import tn.esprit.backend.repository.PrenatalExamRepository;

@Service
@RequiredArgsConstructor
public class ReminderScheduler {

    private final PregnancyRepository pregnancyRepository;
    private final PrenatalExamRepository prenatalExamRepository;
    private final PartnerNotificationRepository partnerNotificationRepository;

    @Scheduled(cron = "0 0 8 * * *")
    public void sendDailyPrenatalReminders() {

        var exams = prenatalExamRepository.findAll().stream()
                .filter(e -> Boolean.FALSE.equals(e.getDone()))
                .toList();

        for (var exam : exams) {
            partnerNotificationRepository.save(PartnerNotification.builder()
                    .type(NotificationType.PRENATAL_REMINDER)
                    .title("Prenatal exam reminder")
                    .body("Don’t forget your exam: " + exam.getExamName())
                    .relatedTo(exam.getPregnancy().getUser())
                    .isRead(false)
                    .build());
        }
    }

}

