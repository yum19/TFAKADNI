package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.Story;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findByExpiresAtGreaterThanOrderByCreatedAtDesc(LocalDateTime now);
    List<Story> findAllByOrderByCreatedAtDesc();
    long countByExpiresAtGreaterThan(LocalDateTime now);
    Optional<Story> findByIdAndUserId(Long id, Long userId);
}