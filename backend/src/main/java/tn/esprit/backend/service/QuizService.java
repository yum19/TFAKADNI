package tn.esprit.backend.service;

import tn.esprit.backend.dto.request.QuizRequest;
import tn.esprit.backend.dto.request.SubmitQuizRequest;
import tn.esprit.backend.entity.Quiz;
import tn.esprit.backend.entity.QuizAttempt;

import java.util.List;

public interface QuizService {

    Quiz createQuiz(QuizRequest request);

    Quiz getQuizById(Long quizId);

    QuizAttempt submitQuiz(SubmitQuizRequest request);

    List<QuizAttempt> getAttempts(Long userId, Long quizId);

    Quiz updateQuiz(Long quizId, QuizRequest request);

    void deleteQuiz(Long quizId);

    Quiz generateQuizViaAI(Long courseModuleId, String topic, int numberOfQuestions, Integer passScore);

}
