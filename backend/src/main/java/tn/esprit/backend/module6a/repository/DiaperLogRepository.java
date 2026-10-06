package tn.esprit.backend.module6a.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6a.entity.DiaperLog;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DiaperLogRepository extends JpaRepository<DiaperLog, Long> {

    List<DiaperLog> findByBabyIdOrderByChangeTimeDesc(Long babyId);

    Optional<DiaperLog> findByIdAndBabyId(Long id, Long babyId);

    List<DiaperLog> findByBabyIdAndChangeTimeBetweenOrderByChangeTimeDesc(
            Long babyId,
            LocalDateTime start,
            LocalDateTime end
    );
    Optional<DiaperLog> findFirstByBabyIdOrderByChangeTimeDesc(Long babyId);
}