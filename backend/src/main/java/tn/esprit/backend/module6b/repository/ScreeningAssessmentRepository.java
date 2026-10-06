package tn.esprit.backend.module6b.repository;

import tn.esprit.backend.module6b.entity.ScreeningAssessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ScreeningAssessmentRepository extends JpaRepository<ScreeningAssessment, Long> {

    List<ScreeningAssessment> findByMotherIdOrderByAssessmentDateDesc(Long motherId);

    Optional<ScreeningAssessment> findTopByMotherIdOrderByAssessmentDateDesc(Long motherId);
}