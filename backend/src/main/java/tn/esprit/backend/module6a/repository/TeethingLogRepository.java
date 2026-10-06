package tn.esprit.backend.module6a.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6a.entity.TeethingLog;

import java.util.List;
import java.util.Optional;

public interface TeethingLogRepository extends JpaRepository<TeethingLog, Long> {

    List<TeethingLog> findByBabyIdOrderByEruptionDateDescIdDesc(Long babyId);

    Optional<TeethingLog> findByIdAndBabyId(Long id, Long babyId);

    Optional<TeethingLog> findFirstByBabyIdOrderByEruptionDateDescIdDesc(Long babyId);
}