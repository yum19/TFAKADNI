package tn.esprit.backend.module6a.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6a.entity.GrowthRecord;

import java.util.List;
import java.util.Optional;

public interface GrowthRecordRepository extends JpaRepository<GrowthRecord, Long> {

    List<GrowthRecord> findByBabyIdOrderByRecordDateDescIdDesc(Long babyId);

    Optional<GrowthRecord> findByIdAndBabyId(Long id, Long babyId);

    Optional<GrowthRecord> findFirstByBabyIdOrderByRecordDateDescIdDesc(Long babyId);

    List<GrowthRecord> findByBabyIdOrderByRecordDateAsc(Long babyId);
}