package tn.esprit.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AiService {

    @Value("${anthropic.api.key}")
    private String anthropicApiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String CLAUDE_URL   = "https://api.anthropic.com/v1/messages";
    private static final String CLAUDE_MODEL = "claude-sonnet-4-20250514";

    private static final String VITALS_SYSTEM_PROMPT =
            "You are a compassionate prenatal medical assistant. " +
                    "Analyze the patient's vital signs and provide a warm, clear, non-alarming summary in English. " +
                    "Focus on trends, highlight what's normal, and gently flag anything that needs attention. " +
                    "Use simple language the patient can understand. " +
                    "Format with short paragraphs, no bullet points. " +
                    "End with an encouraging sentence.";

    private static final String PORTRAIT_SYSTEM_PROMPT =
            "You are a poetic and warm prenatal storyteller. " +
                    "Given a pregnancy week and each parent's physical traits, generate a structured baby portrait. " +
                    "Respond ONLY with valid JSON, no markdown, no explanation, no backticks. " +
                    "Use exactly these 8 keys: eyes, hair, skin, face, hands, dream, message, poem. " +
                    "Each value is one warm poetic English sentence. " +
                    "eyes: describe the baby's eye color blending both parents, shape, expression. " +
                    "hair: describe the baby's hair color and texture blending both parents. " +
                    "skin: describe the baby's skin tone and glow. " +
                    "face: describe nose, lips, cheeks, possible dimples, smile. " +
                    "hands: describe the baby's tiny fingers and hands. " +
                    "dream: one poetic sentence about what the baby feels or dreams right now. " +
                    "message: one tender sentence addressed directly to the mother. " +
                    "poem: a beautiful 2-line poem summarizing the whole portrait. " +
                    "Be specific, warm and magical. Never mention medical risks.";

    // ══════════════════════════════════════════════════════
    // ANALYZE VITALS
    // ══════════════════════════════════════════════════════
    public String analyzeVitals(List<Map<String, Object>> vitals) {
        try {
            String userMessage;

            if (vitals.size() == 1 && vitals.get(0).containsKey("followUp")) {
                userMessage = String.valueOf(vitals.get(0).get("followUp"));
            } else {
                StringBuilder sb = new StringBuilder();
                sb.append("Here are my last ").append(vitals.size())
                        .append(" vital measurements during my pregnancy:\n\n");
                for (int i = 0; i < vitals.size(); i++) {
                    Map<String, Object> v = vitals.get(i);
                    sb.append("Measurement ").append(i + 1)
                            .append(" (").append(v.getOrDefault("measuredAt", "N/A")).append("):\n")
                            .append("  - Blood pressure: ")
                            .append(v.getOrDefault("systolicBp", "N/A")).append("/")
                            .append(v.getOrDefault("diastolicBp", "N/A")).append(" mmHg\n")
                            .append("  - Weight: ").append(v.getOrDefault("weightKg", "N/A")).append(" kg\n")
                            .append("  - Heart rate: ").append(v.getOrDefault("heartRate", "N/A")).append(" bpm\n")
                            .append("  - Oxygen: ").append(v.getOrDefault("oxygenPct", "N/A")).append("%\n")
                            .append("  - Temperature: ").append(v.getOrDefault("temperatureC", "N/A")).append("°C\n")
                            .append("  - Glucose: ").append(v.getOrDefault("glucoseMmol", "N/A")).append(" mmol/L\n\n");
                }
                sb.append("Please analyze the trends and give me a warm medical summary.");
                userMessage = sb.toString();
            }
            return callClaude(VITALS_SYSTEM_PROMPT, userMessage, 1000);
        } catch (Exception e) {
            return "Unable to generate analysis at this time. Please try again later.";
        }
    }

    // ══════════════════════════════════════════════════════
    // BABY PORTRAIT — returns JSON string
    // ══════════════════════════════════════════════════════
    public String generateBabyPortrait(Map<String, Object> request) {
        try {
            int week            = request.get("week") != null ? ((Number) request.get("week")).intValue() : 20;
            String momEyeColor  = (String) request.getOrDefault("momEyeColor",  "brown");
            String momHairColor = (String) request.getOrDefault("momHairColor", "dark brown");
            String momSkinTone  = (String) request.getOrDefault("momSkinTone",  "medium");
            String momFeatures  = (String) request.getOrDefault("momFeatures",  "");
            String dadEyeColor  = (String) request.getOrDefault("dadEyeColor",  "brown");
            String dadHairColor = (String) request.getOrDefault("dadHairColor", "dark brown");
            String dadSkinTone  = (String) request.getOrDefault("dadSkinTone",  "medium");
            String dadFeatures  = (String) request.getOrDefault("dadFeatures",  "");

            StringBuilder sb = new StringBuilder();
            sb.append("Baby is at week ").append(week).append(" of pregnancy.\n\n");
            sb.append("Mother's traits:\n");
            sb.append("- Eyes: ").append(momEyeColor).append("\n");
            sb.append("- Hair: ").append(momHairColor).append("\n");
            sb.append("- Skin: ").append(momSkinTone).append("\n");
            if (momFeatures != null && !momFeatures.isBlank())
                sb.append("- Special features: ").append(momFeatures).append("\n");
            sb.append("\nFather's traits:\n");
            sb.append("- Eyes: ").append(dadEyeColor).append("\n");
            sb.append("- Hair: ").append(dadHairColor).append("\n");
            sb.append("- Skin: ").append(dadSkinTone).append("\n");
            if (dadFeatures != null && !dadFeatures.isBlank())
                sb.append("- Special features: ").append(dadFeatures).append("\n");
            sb.append("\nGenerate the baby portrait JSON.");

            return callClaude(PORTRAIT_SYSTEM_PROMPT, sb.toString(), 900);
        } catch (Exception e) {
            return "{\"eyes\":\"Unable to generate portrait.\",\"hair\":\"\",\"skin\":\"\",\"face\":\"\",\"hands\":\"\",\"dream\":\"\",\"message\":\"Please try again.\",\"poem\":\"\"}";
        }
    }

    // ══════════════════════════════════════════════════════
    // SHARED CLAUDE CALLER
    // ══════════════════════════════════════════════════════
    private String callClaude(String systemPrompt, String userMessage, int maxTokens) throws Exception {
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model",      CLAUDE_MODEL);
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("system",     systemPrompt);
        requestBody.put("messages",   List.of(
                Map.of("role", "user", "content", userMessage)
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key",         anthropicApiKey);
        headers.set("anthropic-version", "2023-06-01");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.exchange(
                CLAUDE_URL, HttpMethod.POST, entity, String.class
        );
        JsonNode root = objectMapper.readTree(response.getBody());
        return root.path("content").get(0).path("text").asText();
    }
}