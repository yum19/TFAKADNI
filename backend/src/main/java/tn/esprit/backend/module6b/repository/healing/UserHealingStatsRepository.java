package tn.esprit.backend.module6b.repository.healing;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6b.entity.healing.UserHealingStats;

import java.util.Optional;

public interface UserHealingStatsRepository extends JpaRepository<UserHealingStats, Long> {
    Optional<UserHealingStats> findByMotherId(Long motherId);

}