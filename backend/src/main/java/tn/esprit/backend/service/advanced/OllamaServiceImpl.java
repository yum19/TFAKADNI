package tn.esprit.backend.service.advanced;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OllamaServiceImpl implements OllamaService {

    private final RestClient ollamaClient;

    @Value("${ollama.base-url}")
    private String baseUrl;

    @Value("${ollama.model}")
    private String model;

    @Value("${ollama.keep-alive:10m}")
    private String keepAlive;

    private String generate(String prompt) {
        // Style Fluent : post() -> uri() -> body() -> retrieve()
        JsonNode jsonResponse = ollamaClient.post()
                .uri(baseUrl + "/api/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "model", model,
                        "prompt", prompt,
                        "stream", false,
                        "keep_alive", keepAlive
                ))
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        (request, response) -> {
                            throw new RuntimeException("Ollama API Error: " + response.getStatusCode());
                        })
                .body(JsonNode.class);

        if (jsonResponse != null && jsonResponse.path("response").isTextual()) {
            return jsonResponse.path("response").asText("").trim();
        }

        return "No response generated";
    }

    @Override
    public String summarizePartnerGuide(String guideContent) {
        String prompt = """
                You are helping inside a pregnancy support app.
                Task: summarize the following partner guide in simple, supportive English.
                Rules:
                - Keep it short
                - Use clear everyday language
                - Keep a warm and helpful tone
                - Return only the summary

                Guide:
                """ + guideContent;

        return generate(prompt);
    }

    @Override
    public String simplifyCourseContent(String courseContent) {
        String prompt = """
                You are helping inside a pregnancy learning app.
                Task: rewrite the following educational course content in a simpler way for beginners.
                Rules:
                - Make it easier to understand
                - Keep the meaning correct
                - Use short sentences
                - Return only the simplified version

                Course content:
                """ + courseContent;

        return generate(prompt);
    }

    @Override
    public String generateSupportivePartnerTips(Integer pregnancyWeek, String situation) {
        String prompt = """
                You are helping a father or partner support a pregnant woman.
                Task: generate 5 practical and kind support tips.
                Rules:
                - Tips must be realistic
                - Tone must be supportive
                - Keep them short
                - Mention the pregnancy week naturally when useful
                - Return only the tips as plain text

                Pregnancy week:
                """ + pregnancyWeek + """
                
                Situation:
                """ + situation;

        return generate(prompt);
    }

    @Override
    public String explainQuizCorrectionSimply(String question, String correctAnswer, String userAnswer, String courseContext) {
        String prompt = """
                You are helping explain a quiz correction inside a pregnancy learning app.
                Task: explain simply why the correct answer is correct and why the user's answer is not the best one.
                Rules:
                - Be kind, not harsh
                - Use simple teaching language
                - Keep it short and clear
                - Return only the explanation

                Question:
                """ + question + """

                Correct answer:
                """ + correctAnswer + """

                User answer:
                """ + userAnswer + """

                Course context:
                """ + (courseContext == null ? "" : courseContext);

        return generate(prompt);
    }
}
