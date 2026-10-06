package tn.esprit.backend.module6b.repository;

import tn.esprit.backend.module6b.entity.PredictionResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PredictionResultRepository extends JpaRepository<PredictionResult, Long> {

    List<PredictionResult> findByScreeningAssessmentMotherIdOrderByPredictionDateDesc(Long motherId);

    Optional<PredictionResult> findTopByScreeningAssessmentMotherIdOrderByPredictionDateDesc(Long motherId);
}