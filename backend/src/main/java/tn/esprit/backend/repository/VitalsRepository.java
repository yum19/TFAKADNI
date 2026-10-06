package tn.esprit.backend.repository;

import tn.esprit.backend.entity.Vitals;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VitalsRepository
        extends JpaRepository<Vitals, Long> {

    List<Vitals> findByUserId(Long userId);

    List<Vitals> findByUserIdOrderByMeasuredAtDesc(Long userId);

    List<Vitals> findByPregnancyIdOrderByMeasuredAtDesc(Long pregnancyId);

    List<Vitals> findByPregnancyId(Long pregnancyId);

    void deleteByPregnancyId(Long pregnancyId);   // ← AJOUTÉ
}