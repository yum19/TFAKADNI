package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.backend.entity.PrenatalExam;
import java.util.List;

@Repository
public interface PrenatalExamRepository extends JpaRepository<PrenatalExam, Long> {

    List<PrenatalExam> findByPregnancyId(Long pregnancyId);

    List<PrenatalExam> findByPregnancyIdAndDone(Long pregnancyId, boolean done);

    // ← NOUVEAU : supprimer les examens liés à un vital
    void deleteByVitalId(Long vitalId);

    // ← NOUVEAU : récupérer les examens générés par des alertes
    List<PrenatalExam> findByPregnancyIdAndVitalIsNotNull(Long pregnancyId);
}