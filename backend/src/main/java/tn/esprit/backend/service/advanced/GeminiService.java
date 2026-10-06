package tn.esprit.backend.service.advanced;

import java.util.List;

public interface GeminiService {

    String summarizePartnerGuideById(Long guideId);

    String simplifyCourseModuleById(Long moduleId);

    String generateSupportivePartnerTipsByPregnancyId(Long pregnancyId);

    String explainQuizCorrectionByQuizAttemptId(Long quizAttemptId);

    String generateRecommendationReason(String courseTitle, String courseCategory, List<String> userAffinities, Integer currentWeek);

    String generateQuizQuestionsJson(String topic, int numberOfQuestions);

    String evaluateOpenEndedAnswerJson(String question, String answer);

    String generateContent(String prompt);
}
