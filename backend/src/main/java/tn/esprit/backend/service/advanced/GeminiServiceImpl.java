package tn.esprit.backend.service.advanced;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import tn.esprit.backend.entity.*;
import tn.esprit.backend.repository.PregnancyRepository;
import tn.esprit.backend.repository.QuizAttemptRepository;
import com.fasterxml.jackson.databind.JsonNode;
import tn.esprit.backend.repository.CourseModuleRepository;
import tn.esprit.backend.repository.PartnerGuideRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GeminiServiceImpl implements GeminiService {

    private final RestClient geminiClient;

    private final PartnerGuideRepository partnerGuideRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final PregnancyRepository pregnancyRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    @Value("${gemini.base-url}")
    private String baseUrl;

    @Value("${gemini.model}")
    private String model;

    @Value("${gemini.api-key}")
    private String apiKey;

    private String generateText(String prompt) {
        String url = String.format("%s/models/%s:generateContent?key=%s", baseUrl, model, apiKey);

        Map<String, Object> payload = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.6,
                        "maxOutputTokens", 2048
                )
        );

        JsonNode response = geminiClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    throw new RuntimeException("Gemini API Error: " + res.getStatusCode());
                })
                .body(JsonNode.class);

        return extractText(response);
    }

    private String extractText(JsonNode responseBody) {
        if (responseBody == null) {
            throw new RuntimeException("Gemini returned a null response");
        }

        String text = responseBody.path("candidates")
                .path(0)
                .path("content")
                .path("parts")
                .path(0)
                .path("text")
                .asText("");

        if (text.isEmpty()) {
            throw new RuntimeException("Unable to extract text from Gemini response");
        }

        return text.trim();
    }

    @Override
    public String summarizePartnerGuideById(Long guideId) {
        PartnerGuide guide = partnerGuideRepository.findById(guideId)
                .orElseThrow(() -> new RuntimeException("Partner guide not found"));

        String prompt = """
                You are helping inside a pregnancy support app.
                Task: summarize this partner guide in simple, supportive English.
                Rules:
                - keep it short
                - use clear everyday language
                - keep a warm and helpful tone
                - return only the summary

                Guide title:
                """ + guide.getTitle() + """

                Category:
                """ + guide.getCategory() + """

                Target week:
                """ + guide.getTargetWeek() + """

                Guide content:
                """ + guide.getContent();

        return generateText(prompt);
    }

    @Override
    public String simplifyCourseModuleById(Long moduleId) {
        CourseModule module = courseModuleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Course module not found"));

        if (module.getContentText() == null || module.getContentText().isBlank()) {
            throw new RuntimeException("This course module has no contentText. Add real lesson text before using Gemini.");
        }

        String prompt = """
                You are helping inside a pregnancy learning app.
                Task: rewrite this course module content in a simpler way for beginners.
                Rules:
                - make it easier to understand
                - keep the medical meaning correct
                - use short sentences
                - return only the simplified version

                Module title:
                """ + module.getTitle() + """

                Course:
                """ + (module.getCourse() != null ? module.getCourse().getTitle() : "") + """

                Original content:
                """ + module.getContentText();

        return generateText(prompt);
    }

    @Override
    public String generateSupportivePartnerTipsByPregnancyId(Long pregnancyId) {
        Pregnancy pregnancy = pregnancyRepository.findById(pregnancyId)
                .orElseThrow(() -> new RuntimeException("Pregnancy not found"));

        String motherName = pregnancy.getUser() != null
                ? pregnancy.getUser().getFirstName() + " " + pregnancy.getUser().getLastName()
                : "the mother";

        // === NEW DYNAMIC WEEK CALCULATION ===
        int currentWeek = 0;
        if (pregnancy.getLmpDate() != null) {
            long days = ChronoUnit.DAYS.between(pregnancy.getLmpDate(), LocalDate.now());
            currentWeek = (int) (days / 7);
        }

        String prompt = """
                You are helping a father or partner support a pregnant woman.
                Task: generate 5 practical and kind support tips.
                Rules:
                - tips must be realistic
                - tone must be supportive
                - keep them short
                - adapt them to the pregnancy week and context
                - return only the tips as plain text

                Mother name:
                """ + motherName + """

                Pregnancy week:
                """ + currentWeek + """

                Pregnancy type:
                """ + pregnancy.getPregnancyType() + """

                Doctor:
                """ + pregnancy.getDoctorName() + """

                Hospital:
                """ + pregnancy.getHospitalName() + """

                Notes:
                """ + pregnancy.getNotes();

        return generateText(prompt);
    }

    @Override
    public String explainQuizCorrectionByQuizAttemptId(Long quizAttemptId) {
        QuizAttempt quizAttempt = quizAttemptRepository.findById(quizAttemptId)
                .orElseThrow(() -> new RuntimeException("Quiz attempt not found"));

        List<QuizAttemptAnswer> wrongAnswers = quizAttempt.getAnswers().stream()
                .filter(answer -> Boolean.FALSE.equals(answer.getCorrect()))
                .toList();

        if (wrongAnswers.isEmpty()) {
            return "All answers are correct. No correction explanation is needed.";
        }

        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("""
            You are a helpful teacher inside a pregnancy learning app.
            Task: explain simply why each correct answer is correct and why the user's answer is not the best one.
            Rules:
            - be kind, never harsh
            - use simple teaching language
            - keep each explanation short and clear
            - return only the explanations

            """);

        for (QuizAttemptAnswer wrongAnswer : wrongAnswers) {
            Question question = wrongAnswer.getQuestion();
            Choice selectedChoice = wrongAnswer.getSelectedChoice();

            Choice correctChoice = question.getChoices().stream()
                    .filter(choice -> Boolean.TRUE.equals(choice.getCorrect()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Correct choice not found for question id " + question.getId()));

            promptBuilder.append("Question: ").append(question.getQuestionText()).append("\n");
            promptBuilder.append("Correct answer: ").append(correctChoice.getChoiceText()).append("\n");
            promptBuilder.append("User answer: ").append(selectedChoice.getChoiceText()).append("\n\n");
        }

        return generateText(promptBuilder.toString());
    }

    @Override
    public String generateRecommendationReason(String courseTitle, String courseCategory, List<String> userAffinities, Integer currentWeek) {
        String affinities = userAffinities.isEmpty() ? "None yet" : String.join(", ", userAffinities);
        String weekInfo = currentWeek != null ? "Week " + currentWeek + " of pregnancy" : "Pregnancy stage unknown";

        String prompt = """
            You are a smart AI assistant in a pregnancy app.
            Task: Write a single, short, warm sentence explaining why we recommend this course to the mother.
            
            User context: %s. She likes topics about: %s.
            Course to recommend: "%s" (Category: %s).
            
            Rules:
            - Keep it under 15 words.
            - Be warm and direct (e.g., "Since you are in your third trimester, this course helps you prepare...").
            - Return ONLY the sentence, nothing else.
            """.formatted(weekInfo, affinities, courseTitle, courseCategory);

        try {
            return generateText(prompt);
        } catch (Exception e) {
            return "Highly recommended for your current journey.";
        }
    }

    @Override
    public String generateQuizQuestionsJson(String topic, int numberOfQuestions) {
        String prompt = String.format(
                "You are an expert maternal health and parenting educator. Generate exactly %d quiz questions about: '%s'. " +
                        "Include a mix of SINGLE_CHOICE, MULTIPLE_CHOICE, and OPEN_ENDED questions. " +
                        "CRITICAL INSTRUCTION: Return ONLY a valid JSON array of objects. Do not include markdown tags like ```json. " +
                        "Use this exact schema:\n" +
                        "[\n" +
                        "  {\n" +
                        "    \"questionText\": \"The question here\",\n" +
                        "    \"questionType\": \"SINGLE_CHOICE\", // or MULTIPLE_CHOICE or OPEN_ENDED\n" +
                        "    \"choices\": [\n" +
                        "      { \"choiceText\": \"Option 1\", \"correct\": true },\n" +
                        "      { \"choiceText\": \"Option 2\", \"correct\": false }\n" +
                        "    ]\n" +
                        "  }\n" +
                        "]\n" +
                        "For OPEN_ENDED questions, leave the choices array empty [].",
                numberOfQuestions, topic
        );

        String response = generateText(prompt);
        return response.replace("```json", "").replace("```", "").trim();
    }

    @Override
    public String evaluateOpenEndedAnswerJson(String question, String answer) {
        String prompt = String.format(
                "You are an expert maternal health and parenting AI tutor. Evaluate the following user's answer to the quiz question.\n" +
                        "Question: '%s'\n" +
                        "User's Answer: '%s'\n" +
                        "Determine if the user's answer is correct or at least highly accurate based on the context of maternal health.\n" +
                        "CRITICAL INSTRUCTION: Return ONLY a valid JSON object. Do not include markdown tags like ```json.\n" +
                        "Use this exact schema:\n" +
                        "{\n" +
                        "  \"isCorrect\": true, // or false\n" +
                        "  \"feedback\": \"Provide brief, supportive feedback explaining why it's correct, or gently correcting them if they are wrong.\"\n" +
                        "}", question, answer
        );

        String response = generateText(prompt);
        return response.replace("```json", "").replace("```", "").trim();
    }

    @Override
    public String generateContent(String prompt) {
        // This safely exposes your private Gemini call to our new Neuro-Evolutionary Service
        return this.generateText(prompt);
    }
}