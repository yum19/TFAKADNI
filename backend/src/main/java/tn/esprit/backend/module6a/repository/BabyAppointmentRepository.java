package tn.esprit.backend.module6a.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6a.entity.BabyAppointment;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BabyAppointmentRepository extends JpaRepository<BabyAppointment, Long> {

    List<BabyAppointment> findByBabyIdOrderByAppointmentDateDescIdDesc(Long babyId);

    Optional<BabyAppointment> findByIdAndBabyId(Long id, Long babyId);

    List<BabyAppointment> findByBabyIdAndAppointmentDateAfterOrderByAppointmentDateAscIdAsc(
            Long babyId,
            LocalDateTime dateTime
    );

    List<BabyAppointment> findByBabyIdAndAppointmentDateBeforeOrderByAppointmentDateDescIdDesc(
            Long babyId,
            LocalDateTime dateTime
    );
}