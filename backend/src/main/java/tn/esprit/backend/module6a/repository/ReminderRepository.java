package tn.esprit.backend.module6a.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6a.entity.Reminder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReminderRepository extends JpaRepository<Reminder, Long> {

    List<Reminder> findByBabyIdOrderByReminderDateDescIdDesc(Long babyId);

    Optional<Reminder> findByIdAndBabyId(Long id, Long babyId);

    List<Reminder> findByBabyIdAndStatusOrderByReminderDateAscIdAsc(Long babyId, String status);

    List<Reminder> findByBabyIdAndReminderDateBetweenOrderByReminderDateAscIdAsc(
            Long babyId,
            LocalDateTime start,
            LocalDateTime end
    );

    Optional<Reminder> findByBabyIdAndSourceTypeAndSourceId(Long babyId, String sourceType, Long sourceId);

    void deleteByBabyIdAndSourceTypeAndSourceId(Long babyId, String sourceType, Long sourceId);
    long countByBabyIdAndStatus(Long babyId, String status);
}