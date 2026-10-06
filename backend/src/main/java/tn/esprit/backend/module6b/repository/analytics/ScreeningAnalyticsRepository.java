package tn.esprit.backend.module6b.repository.analytics;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import tn.esprit.backend.module6b.entity.PredictionResult;

import java.util.List;

@Repository
public class ScreeningAnalyticsRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public List<PredictionResult> findAllPredictionsWithScreening() {
        return entityManager.createQuery("""
                SELECT p
                FROM PredictionResult p
                JOIN FETCH p.screeningAssessment s
                JOIN FETCH s.mother m
                ORDER BY p.predictionDate ASC
                """, PredictionResult.class)
                .getResultList();
    }
}