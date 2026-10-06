package tn.esprit.backend.mapper;

import tn.esprit.backend.dto.response.*;
import tn.esprit.backend.entity.*;

public class QuizMapper {

    private QuizMapper() {
    }

    public static QuizResponse toResponse(Quiz quiz) {
        return QuizResponse.builder()
                .id(quiz.getId())
                .courseModuleId(quiz.getCourseModule() != null ? quiz.getCourseModule().getId() : null)
                .passScore(quiz.getPassScore())
                .questions(
                        quiz.getQuestions().stream()
                                .map(question -> QuestionResponse.builder()
                                        .id(question.getId())
                                        .questionText(question.getQuestionText())
                                        .questionOrder(question.getQuestionOrder())
                                        // Safely convert the Enum to a String for the Frontend
                                        .questionType(question.getQuestionType() != null ? question.getQuestionType().name() : "SINGLE_CHOICE")
                                        .choices(
                                                question.getChoices().stream()
                                                        .map(choice -> ChoiceResponse.builder()
                                                                .id(choice.getId())
                                                                .choiceText(choice.getChoiceText())
                                                                .choiceOrder(choice.getChoiceOrder())
                                                                .correct(choice.getCorrect())
                                                                .build())
                                                        .toList()
                                        )
                                        .build())
                                .toList()
                )
                .build();
    }

    public static QuizAttemptResponse toAttemptResponse(QuizAttempt attempt) {
        return QuizAttemptResponse.builder()
                .id(attempt.getId())
                .quizId(attempt.getQuiz() != null ? attempt.getQuiz().getId() : null)
                .score(attempt.getScore())
                .passed(attempt.getPassed())
                .takenAt(attempt.getTakenAt())
                .answers(
                        attempt.getAnswers().stream()
                                .map(answer -> QuizAttemptAnswerResponse.builder()
                                        .id(answer.getId())
                                        .questionId(answer.getQuestion() != null ? answer.getQuestion().getId() : null)

                                        // 1. Safely handle SINGLE_CHOICE
                                        .selectedChoice(answer.getSelectedChoice() != null ?
                                                ChoiceResponse.builder()
                                                        .id(answer.getSelectedChoice().getId())
                                                        .choiceText(answer.getSelectedChoice().getChoiceText())
                                                        .build() : null)

                                        // 2. Safely handle MULTIPLE_CHOICE arrays
                                        .selectedChoices(answer.getSelectedChoices() != null ?
                                                answer.getSelectedChoices().stream()
                                                        .map(c -> ChoiceResponse.builder()
                                                                .id(c.getId())
                                                                .choiceText(c.getChoiceText())
                                                                .build())
                                                        .toList() : null)

                                        // 3. Handle OPEN_ENDED text & AI Feedback from Gemini
                                        .openEndedAnswer(answer.getOpenEndedAnswer())
                                        .aiFeedback(answer.getAiFeedback())

                                        .correct(answer.getCorrect())
                                        .build())
                                .toList()
                )
                .build();
    }
}