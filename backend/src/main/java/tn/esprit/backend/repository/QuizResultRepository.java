package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.backend.entity.QuizAttempt;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizResultRepository extends JpaRepository<QuizAttempt, Long> {

    List<QuizAttempt> findByUserIdAndQuizIdOrderByTakenAtDesc(Long userId, Long quizId);

    Optional<QuizAttempt> findTopByUserIdAndQuizIdOrderByTakenAtDesc(Long userId, Long quizId);

    List<QuizAttempt> findByUserIdOrderByTakenAtDesc(Long userId);
}

