package tn.esprit.backend.module6a.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6a.entity.BabyInsight;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BabyInsightRepository extends JpaRepository<BabyInsight, Long> {

    List<BabyInsight> findByBabyIdOrderByGeneratedAtDescIdDesc(Long babyId);

    List<BabyInsight> findByBabyIdAndIsReadFalseOrderByGeneratedAtDescIdDesc(Long babyId);

    Optional<BabyInsight> findByIdAndBabyId(Long id, Long babyId);

    long countByBabyIdAndIsReadFalse(Long babyId);

    Optional<BabyInsight> findFirstByBabyIdAndRuleCodeAndStatusOrderByGeneratedAtDescIdDesc(
            Long babyId,
            String ruleCode,
            String status
    );

    Optional<BabyInsight> findFirstByBabyIdAndRuleCodeAndStatusAndDismissedAtAfterOrderByDismissedAtDesc(
            Long babyId,
            String ruleCode,
            String status,
            LocalDateTime dismissedAtThreshold
    );

}