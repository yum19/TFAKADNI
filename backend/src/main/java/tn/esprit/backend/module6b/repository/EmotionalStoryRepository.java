package tn.esprit.backend.module6b.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6b.entity.EmotionalStory;

import java.util.List;
import java.util.Optional;

public interface EmotionalStoryRepository extends JpaRepository<EmotionalStory, Long> {

    List<EmotionalStory> findByMotherIdOrderByCreatedAtDesc(Long motherId);

    Optional<EmotionalStory> findTopByMotherIdOrderByCreatedAtDesc(Long motherId);
}