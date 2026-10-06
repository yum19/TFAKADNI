package tn.esprit.backend.module6b.repository;

import tn.esprit.backend.module6b.entity.ContraceptionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ContraceptionLogRepository
        extends JpaRepository<ContraceptionLog, Long> {

    // Historique complet trié par date
    List<ContraceptionLog> findByMotherIdOrderByStartDateDesc(Long motherId);

    // ✅ Méthode actuellement ACTIVE
    Optional<ContraceptionLog> findByMotherIdAndStatus(Long motherId, String status);

    // ✅ Historique filtré par status
    List<ContraceptionLog> findByMotherIdAndStatusOrderByStartDateDesc(
            Long motherId, String status);
}