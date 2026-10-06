package tn.esprit.backend.module6b.repository.healing;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6b.entity.healing.UserBadge;

import java.util.List;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    List<UserBadge> findByMotherIdOrderByEarnedAtDesc(Long motherId);
    boolean existsByMotherIdAndBadge_Id(Long motherId, Long badgeId);
}