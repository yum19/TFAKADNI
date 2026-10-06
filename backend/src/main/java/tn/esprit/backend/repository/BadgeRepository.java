package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.backend.entity.Badge;

import java.util.List;
import java.util.Optional;

@Repository
public interface BadgeRepository extends JpaRepository<Badge, Long> {

    List<Badge> findByUserIdOrderByAwardedAtDesc(Long userId);

    Optional<Badge> findByUserIdAndCourseId(Long userId, Long courseId);

}
