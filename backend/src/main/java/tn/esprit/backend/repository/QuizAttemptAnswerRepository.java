package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.QuizAttemptAnswer;

import java.util.List;

public interface QuizAttemptAnswerRepository extends JpaRepository<QuizAttemptAnswer, Long> {
    List<QuizAttemptAnswer> findByQuizAttemptId(Long quizAttemptId);
}
