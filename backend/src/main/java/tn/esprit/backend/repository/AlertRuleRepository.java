package tn.esprit.backend.repository;

import tn.esprit.backend.entity.AlertRule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AlertRuleRepository
        extends JpaRepository<AlertRule, Long> {

    List<AlertRule> findByUserId(Long userId);

    List<AlertRule> findByUserIdAndActive(
            Long userId,
            Boolean active
    );
}