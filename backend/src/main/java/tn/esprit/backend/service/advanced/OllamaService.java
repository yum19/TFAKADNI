package tn.esprit.backend.service.advanced;

public interface OllamaService {

    String summarizePartnerGuide(String guideContent);

    String simplifyCourseContent(String courseContent);

    String generateSupportivePartnerTips(Integer pregnancyWeek, String situation);

    String explainQuizCorrectionSimply(String question, String correctAnswer, String userAnswer, String courseContext);
}
