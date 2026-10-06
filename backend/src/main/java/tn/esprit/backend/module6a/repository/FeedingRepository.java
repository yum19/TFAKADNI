package tn.esprit.backend.module6a.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6a.entity.Feeding;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FeedingRepository extends JpaRepository<Feeding, Long> {

    List<Feeding> findByBabyIdOrderByFeedingDateDescFeedingTimeDesc(Long babyId);

    Optional<Feeding> findByIdAndBabyId(Long id, Long babyId);
    Optional<Feeding> findFirstByBabyIdOrderByFeedingDateDescFeedingTimeDesc(Long babyId);

    List<Feeding> findByBabyIdAndFeedingDateAfterOrderByFeedingDateDescFeedingTimeDesc(
            Long babyId,
            LocalDate date
    );}