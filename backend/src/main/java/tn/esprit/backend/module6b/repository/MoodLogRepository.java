package tn.esprit.backend.module6b.repository;

import tn.esprit.backend.module6b.entity.MoodLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MoodLogRepository extends JpaRepository<MoodLog, Long> {

    List<MoodLog> findByMotherIdOrderByLogDateDesc(Long motherId);
}