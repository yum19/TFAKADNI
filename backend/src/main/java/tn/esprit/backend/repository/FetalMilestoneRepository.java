package tn.esprit.backend.repository;

import tn.esprit.backend.entity.FetalMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FetalMilestoneRepository
        extends JpaRepository<FetalMilestone, Long> {

    FetalMilestone findByWeekNumber(Integer weekNumber);

    List<FetalMilestone> findByTrimester(
            FetalMilestone.Trimester trimester
    );
}