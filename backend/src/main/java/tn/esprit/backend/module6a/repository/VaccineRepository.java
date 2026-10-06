package tn.esprit.backend.module6a.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6a.entity.Vaccine;

import java.util.List;
import java.util.Optional;

public interface VaccineRepository extends JpaRepository<Vaccine, Long> {

    List<Vaccine> findByBabyIdOrderByScheduledDateAscIdAsc(Long babyId);

    Optional<Vaccine> findByIdAndBabyId(Long id, Long babyId);

}