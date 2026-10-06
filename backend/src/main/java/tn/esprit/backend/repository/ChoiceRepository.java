package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.Choice;

import java.util.List;
import java.util.Optional;

public interface ChoiceRepository extends JpaRepository<Choice, Long> {
    List<Choice> findByQuestionIdOrderByChoiceOrderAsc(Long questionId);
    Optional<Choice> findByQuestionIdAndCorrectTrue(Long questionId);
}
