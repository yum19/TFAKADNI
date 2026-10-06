package tn.esprit.backend.repository;

import tn.esprit.backend.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface AlertRepository
        extends JpaRepository<Alert, Long> {

    List<Alert> findByUserId(Long userId);

    List<Alert> findByUserIdAndIsRead(
            Long userId,
            Boolean isRead
    );

    List<Alert> findByUserIdOrderByTriggeredAtDesc(Long userId);

    @Transactional
    void deleteByVitalId(Long vitalId);
}