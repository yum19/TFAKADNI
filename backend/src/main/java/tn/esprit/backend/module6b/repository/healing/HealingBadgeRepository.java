package tn.esprit.backend.module6b.repository.healing;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6b.entity.healing.BadgeType;
import tn.esprit.backend.module6b.entity.healing.HealingBadge;

import java.util.Optional;

public interface HealingBadgeRepository extends JpaRepository<HealingBadge, Long> {
    Optional<HealingBadge> findByBadgeType(BadgeType badgeType);
}