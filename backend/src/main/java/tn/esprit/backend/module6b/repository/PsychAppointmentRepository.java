package tn.esprit.backend.module6b.repository;

import jakarta.transaction.Transactional;
import tn.esprit.backend.module6b.entity.PsychAppointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PsychAppointmentRepository extends JpaRepository<PsychAppointment, Long> {

    List<PsychAppointment> findByMotherIdOrderByAppointmentDateDesc(Long motherId);

    List<PsychAppointment> findByMotherIdAndStatusOrderByAppointmentDateDesc(Long motherId, String status);

    @Transactional
    void deleteByPredictionResultId(Long predictionResultId);
}