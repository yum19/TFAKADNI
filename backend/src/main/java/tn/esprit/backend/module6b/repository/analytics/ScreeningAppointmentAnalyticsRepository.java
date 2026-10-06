package tn.esprit.backend.module6b.repository.analytics;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import tn.esprit.backend.module6b.entity.PredictionResult;
import tn.esprit.backend.module6b.entity.PsychAppointment;

import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class ScreeningAppointmentAnalyticsRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public List<PredictionResult> findAllPredictionsWithScreening() {
        return entityManager.createQuery("""
                SELECT p
                FROM PredictionResult p
                JOIN FETCH p.screeningAssessment s
                JOIN FETCH s.mother m
                ORDER BY p.predictionDate DESC
                """, PredictionResult.class)
                .getResultList();
    }

    public List<PsychAppointment> findAllAppointmentsLinkedToPrediction() {
        return entityManager.createQuery("""
                SELECT a
                FROM PsychAppointment a
                JOIN FETCH a.predictionResult p
                JOIN FETCH p.screeningAssessment s
                JOIN FETCH a.mother m
                WHERE a.predictionResult IS NOT NULL
                ORDER BY a.appointmentDate DESC
                """, PsychAppointment.class)
                .getResultList();
    }

    public Map<Long, List<PsychAppointment>> groupAppointmentsByPredictionId(List<PsychAppointment> appointments) {
        return appointments.stream()
                .filter(a -> a.getPredictionResult() != null && a.getPredictionResult().getId() != null)
                .collect(Collectors.groupingBy(a -> a.getPredictionResult().getId()));
    }

    public double computeAverageDelayDays(List<PredictionResult> predictions, Map<Long, List<PsychAppointment>> appointmentsByPredictionId) {
        List<Long> delays = new ArrayList<>();

        for (PredictionResult prediction : predictions) {
            if (prediction.getId() == null || prediction.getPredictionDate() == null) continue;

            List<PsychAppointment> linkedAppointments = appointmentsByPredictionId.get(prediction.getId());
            if (linkedAppointments == null || linkedAppointments.isEmpty()) continue;

            linkedAppointments.stream()
                    .filter(a -> a.getAppointmentDate() != null)
                    .map(a -> ChronoUnit.DAYS.between(prediction.getPredictionDate().toLocalDate(), a.getAppointmentDate().toLocalDate()))
                    .filter(delay -> delay >= 0)
                    .min(Long::compareTo)
                    .ifPresent(delays::add);
        }

        return delays.isEmpty()
                ? 0.0
                : delays.stream().mapToLong(Long::longValue).average().orElse(0.0);
    }
}