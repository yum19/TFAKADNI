package tn.esprit.backend.module6a.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6a.entity.BabyMilestone;

import java.util.List;
import java.util.Optional;

public interface BabyMilestoneRepository extends JpaRepository<BabyMilestone, Long> {

    List<BabyMilestone> findByBabyIdOrderByMilestoneDateDescIdDesc(Long babyId);

    Optional<BabyMilestone> findByIdAndBabyId(Long id, Long babyId);

    Optional<BabyMilestone> findFirstByBabyIdOrderByMilestoneDateDescIdDesc(Long babyId);

    List<BabyMilestone> findByBabyIdAndCategoryOrderByMilestoneDateDescIdDesc(Long babyId, String category);
}