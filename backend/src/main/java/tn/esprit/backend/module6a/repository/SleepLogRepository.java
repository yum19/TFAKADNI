package tn.esprit.backend.module6a.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6a.entity.SleepLog;

import java.util.List;
import java.util.Optional;

public interface SleepLogRepository extends JpaRepository<SleepLog, Long> {

    List<SleepLog> findByBabyIdOrderBySleepStartDesc(Long babyId);

    Optional<SleepLog> findByIdAndBabyId(Long id, Long babyId);
    List<SleepLog> findByBabyIdAndSleepStartAfterOrderBySleepStartDesc(Long babyId, java.time.LocalDateTime dateTime);
    Optional<SleepLog> findFirstByBabyIdOrderBySleepStartDesc(Long babyId);
}