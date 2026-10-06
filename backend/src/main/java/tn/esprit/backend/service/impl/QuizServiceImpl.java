package tn.esprit.backend.service.impl;


import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.dto.request.*;
import tn.esprit.backend.entity.*;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.repository.*;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.QuizService;
import tn.esprit.backend.service.EnrollmentService;
import tn.esprit.backend.dto.request.UpdateProgressRequest;
import tn.esprit.backend.service.advanced.GeminiService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;


import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final ChoiceRepository choiceRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final UserRepository userRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService enrollmentService;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    @Override
    public Quiz createQuiz(QuizRequest request) {
        CourseModule courseModule = courseModuleRepository.findById(request.getCourseModuleId())
                .orElseThrow(() -> new RuntimeException("Course module not found"));

        quizRepository.findByCourseModuleId(request.getCourseModuleId())
                .ifPresent(existing -> {
                    throw new RuntimeException("A quiz already exists for this course module");
                });

        Quiz quiz = Quiz.builder()
                .courseModule(courseModule)
                .passScore(request.getPassScore())
                .questions(new ArrayList<>())
                .build();

        int questionIndex = 1;
        for (QuestionRequest questionRequest : request.getQuestions()) {

            // 1. Safely resolve the QuestionType Enum (defaulting to SINGLE_CHOICE)
            tn.esprit.backend.enumtype.QuestionType qType =
                    (questionRequest.getQuestionType() != null && !questionRequest.getQuestionType().isEmpty())
                            ? tn.esprit.backend.enumtype.QuestionType.valueOf(questionRequest.getQuestionType())
                            : tn.esprit.backend.enumtype.QuestionType.SINGLE_CHOICE;

            Question question = Question.builder()
                    .quiz(quiz)
                    .questionText(questionRequest.getQuestionText())
                    .questionOrder(questionRequest.getQuestionOrder() != null ? questionRequest.getQuestionOrder() : questionIndex)
                    .questionType(qType) // Use the resolved Enum
                    .choices(new ArrayList<>())
                    .build();

            int correctChoicesCount = 0;
            int choiceIndex = 1;

            // 2. Only process choices if the question is NOT OPEN_ENDED
            if (qType != tn.esprit.backend.enumtype.QuestionType.OPEN_ENDED && questionRequest.getChoices() != null) {
                for (ChoiceRequest choiceRequest : questionRequest.getChoices()) {
                    if (Boolean.TRUE.equals(choiceRequest.getCorrect())) {
                        correctChoicesCount++;
                    }

                    Choice choice = Choice.builder()
                            .question(question)
                            .choiceText(choiceRequest.getChoiceText())
                            .choiceOrder(choiceRequest.getChoiceOrder() != null ? choiceRequest.getChoiceOrder() : choiceIndex)
                            .correct(choiceRequest.getCorrect() != null ? choiceRequest.getCorrect() : false)
                            .build();

                    question.getChoices().add(choice);
                    choiceIndex++;
                }
            }

            // 3. Dynamic Validation based on the Question Type
            if (qType == tn.esprit.backend.enumtype.QuestionType.SINGLE_CHOICE && correctChoicesCount != 1) {
                throw new RuntimeException("SINGLE_CHOICE question '" + question.getQuestionText() + "' must have exactly one correct choice.");
            } else if (qType == tn.esprit.backend.enumtype.QuestionType.MULTIPLE_CHOICE && correctChoicesCount < 1) {
                throw new RuntimeException("MULTIPLE_CHOICE question '" + question.getQuestionText() + "' must have at least one correct choice.");
            }

            quiz.getQuestions().add(question);
            questionIndex++;
        }

        return quizRepository.save(quiz);
    }

    @Override
    @Transactional(readOnly = true)
    public Quiz getQuizById(Long quizId) {
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
    }

    @Override
    public QuizAttempt submitQuiz(SubmitQuizRequest request) {
        Quiz quiz = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Question> questions = questionRepository.findByQuizIdOrderByQuestionOrderAsc(quiz.getId());

        if (questions.isEmpty()) {
            throw new RuntimeException("This quiz has no questions");
        }

        QuizAttempt attempt = QuizAttempt.builder()
                .user(user)
                .quiz(quiz)
                .takenAt(LocalDateTime.now())
                .score(0)
                .passed(false)
                .answers(new ArrayList<>())
                .build();

        int totalQuestions = questions.size();
        int correctCount = 0;

        for (Question question : questions) {
            SubmitQuizAnswerRequest submittedAnswer = request.getAnswers().stream()
                    .filter(answer -> answer.getQuestionId().equals(question.getId()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Missing answer for question id " + question.getId()));

            QuizAttemptAnswer attemptAnswer = QuizAttemptAnswer.builder()
                    .quizAttempt(attempt)
                    .question(question)
                    .build();

            boolean isCorrect = false;

            // --- ADVANCED EVALUATION ENGINE ---
            switch (question.getQuestionType()) {
                case SINGLE_CHOICE:
                    Choice singleChoice = choiceRepository.findById(submittedAnswer.getSelectedChoiceId())
                            .orElseThrow(() -> new RuntimeException("Selected choice not found"));
                    isCorrect = Boolean.TRUE.equals(singleChoice.getCorrect());
                    attemptAnswer.setSelectedChoice(singleChoice);
                    break;

                case MULTIPLE_CHOICE:
                    List<Choice> selectedChoices = choiceRepository.findAllById(submittedAnswer.getSelectedChoiceIds());
                    attemptAnswer.setSelectedChoices(selectedChoices);

                    // Extract exactly which IDs are supposed to be correct
                    List<Long> actualCorrectIds = question.getChoices().stream()
                            .filter(Choice::getCorrect)
                            .map(Choice::getId)
                            .toList();

                    List<Long> submittedIds = submittedAnswer.getSelectedChoiceIds();

                    // The answer is correct ONLY if they selected the exact correct number of choices, and all match.
                    if (actualCorrectIds.size() == submittedIds.size() && submittedIds.containsAll(actualCorrectIds)) {
                        isCorrect = true;
                    }
                    break;

                case OPEN_ENDED:
                    String text = submittedAnswer.getTextAnswer();
                    attemptAnswer.setOpenEndedAnswer(text);

                    if (text == null || text.trim().isEmpty()) {
                        isCorrect = false;
                        attemptAnswer.setAiFeedback("No answer was provided.");
                    } else {
                        try {
                            // Call Gemini to grade the text
                            String aiJson = geminiService.evaluateOpenEndedAnswerJson(question.getQuestionText(), text);
                            com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(aiJson);

                            isCorrect = node.path("isCorrect").asBoolean(false);
                            attemptAnswer.setAiFeedback(node.path("feedback").asText("Feedback unavailable."));
                        } catch (Exception e) {
                            System.err.println("AI Evaluation failed: " + e.getMessage());
                            isCorrect = false;
                            attemptAnswer.setAiFeedback("AI Evaluation is currently unavailable for this answer. Please ask your partner guide.");
                        }
                    }
                    break;
            }

            if (isCorrect) correctCount++;
            attemptAnswer.setCorrect(isCorrect);
            attempt.getAnswers().add(attemptAnswer);
        }

        // Calculate final score
        int score = (correctCount * 100) / totalQuestions;
        attempt.setScore(score);
        boolean passed = score >= quiz.getPassScore();
        attempt.setPassed(passed);

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);

        // Update enrollment progress if passed
        if (passed) {
            Course course = quiz.getCourseModule().getCourse();
            enrollmentRepository.findByUserIdAndCourseId(user.getId(), course.getId())
                    .ifPresent(enrollment -> {
                        int totalModules = course.getModules().size();
                        if (totalModules > 0) {
                            int progressIncrement = (int) Math.ceil(100.0 / totalModules);
                            int newProgress = Math.min(100, enrollment.getProgressPct() + progressIncrement);

                            UpdateProgressRequest progressReq = new UpdateProgressRequest();
                            progressReq.setUserId(user.getId());
                            progressReq.setCourseId(course.getId());
                            progressReq.setProgressPct(newProgress);
                            enrollmentService.updateProgress(progressReq);
                        }
                    });
        }
        return savedAttempt;
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizAttempt> getAttempts(Long userId, Long quizId) {
        return quizAttemptRepository.findByUserIdAndQuizIdOrderByTakenAtDesc(userId, quizId);
    }

    @Override
    public Quiz updateQuiz(Long quizId, QuizRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        quiz.setPassScore(request.getPassScore());

        // Clear existing questions (orphanRemoval = true in entity will delete them from DB)
        quiz.getQuestions().clear();

        int questionIndex = 1;
        for (QuestionRequest qReq : request.getQuestions()) {

            // 1. Safely resolve the QuestionType Enum (defaulting to SINGLE_CHOICE)
            tn.esprit.backend.enumtype.QuestionType qType =
                    (qReq.getQuestionType() != null && !qReq.getQuestionType().isEmpty())
                            ? tn.esprit.backend.enumtype.QuestionType.valueOf(qReq.getQuestionType())
                            : tn.esprit.backend.enumtype.QuestionType.SINGLE_CHOICE;

            Question question = Question.builder()
                    .quiz(quiz)
                    .questionText(qReq.getQuestionText())
                    .questionOrder(qReq.getQuestionOrder() != null ? qReq.getQuestionOrder() : questionIndex)
                    .questionType(qType) // Use the resolved Enum
                    .choices(new ArrayList<>())
                    .build();

            int correctChoicesCount = 0;
            int choiceIndex = 1;

            // 2. Only process choices if the question is NOT OPEN_ENDED
            if (qType != tn.esprit.backend.enumtype.QuestionType.OPEN_ENDED && qReq.getChoices() != null) {
                for (ChoiceRequest cReq : qReq.getChoices()) {
                    if (Boolean.TRUE.equals(cReq.getCorrect())) {
                        correctChoicesCount++;
                    }

                    Choice choice = Choice.builder()
                            .question(question)
                            .choiceText(cReq.getChoiceText())
                            .choiceOrder(cReq.getChoiceOrder() != null ? cReq.getChoiceOrder() : choiceIndex)
                            .correct(cReq.getCorrect() != null ? cReq.getCorrect() : false)
                            .build();

                    question.getChoices().add(choice);
                    choiceIndex++;
                }
            }

            // 3. Dynamic Validation based on the Question Type
            if (qType == tn.esprit.backend.enumtype.QuestionType.SINGLE_CHOICE && correctChoicesCount != 1) {
                throw new RuntimeException("SINGLE_CHOICE question '" + question.getQuestionText() + "' must have exactly one correct choice.");
            } else if (qType == tn.esprit.backend.enumtype.QuestionType.MULTIPLE_CHOICE && correctChoicesCount < 1) {
                throw new RuntimeException("MULTIPLE_CHOICE question '" + question.getQuestionText() + "' must have at least one correct choice.");
            }

            quiz.getQuestions().add(question);
            questionIndex++;
        }

        return quizRepository.save(quiz);
    }

    @Override
    public void deleteQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        quizRepository.delete(quiz);
    }

    @Override
    public Quiz generateQuizViaAI(Long courseModuleId, String topic, int numberOfQuestions, Integer passScore) {
        // 1. Get raw JSON from Gemini
        String aiJson = geminiService.generateQuizQuestionsJson(topic, numberOfQuestions);

        try {
            // 2. Parse JSON into a List of QuestionRequests
            List<QuestionRequest> aiQuestions = Arrays.asList(objectMapper.readValue(aiJson, QuestionRequest[].class));

            // 3. Package it into your standard QuizRequest
            QuizRequest request = new QuizRequest();
            request.setCourseModuleId(courseModuleId);
            request.setPassScore(passScore);
            request.setQuestions(aiQuestions);

            // 4. Reuse your existing create logic!
            return this.createQuiz(request);

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse AI generated quiz. AI Output: " + aiJson, e);
        }
    }

}
