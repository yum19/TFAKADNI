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
public class BabyNameService {

    @Value("${anthropic.api.key}")
    private String anthropicApiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
    private static final String MODEL         = "claude-sonnet-4-20250514";

    public JsonNode generateNames(Map<String, String> prefs) throws Exception {

        String gender  = prefs.getOrDefault("gender",  "both");
        String origin  = prefs.getOrDefault("origin",  "No preference");
        String style   = prefs.getOrDefault("style",   "No preference");
        String letter  = prefs.getOrDefault("letter",  "No preference");
        String meaning = prefs.getOrDefault("meaning", "");

        // ── Build prompt ──────────────────────────────────
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an expert in prenatal care and baby naming traditions worldwide. ");
        prompt.append("Generate exactly 10 beautiful baby names based on these preferences:\n\n");
        prompt.append("- Gender: ").append(
                gender.equals("girl") ? "Girl names only" :
                        gender.equals("boy")  ? "Boy names only"  : "Mix of girl and boy names"
        ).append("\n");
        prompt.append("- Origin/Culture: ").append(origin).append("\n");
        prompt.append("- Style: ").append(style).append("\n");
        if (!letter.equals("No preference") && !letter.isEmpty()) {
            prompt.append("- Must start with the letter: ").append(letter).append("\n");
        }
        if (!meaning.isEmpty()) {
            prompt.append("- Preferred meaning theme: ").append(meaning).append("\n");
        }
        prompt.append("\nReturn ONLY a valid JSON object — no markdown, no explanation:\n");
        prompt.append("{\n");
        prompt.append("  \"names\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"name\": \"Name\",\n");
        prompt.append("      \"origin\": \"Country or culture of origin\",\n");
        prompt.append("      \"meaning\": \"Clear meaning of the name (1-2 sentences)\",\n");
        prompt.append("      \"poem\": \"A single warm poetic sentence about this name for a baby\"\n");
        prompt.append("    }\n");
        prompt.append("  ]\n");
        prompt.append("}");

        // ── Call Anthropic API ────────────────────────────
        Map<String, Object> message     = Map.of("role", "user", "content", prompt.toString());
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model",      MODEL);
        requestBody.put("max_tokens", 2000);
        requestBody.put("messages",   List.of(message));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key",         anthropicApiKey);
        headers.set("anthropic-version", "2023-06-01");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(ANTHROPIC_URL, request, String.class);

        // ── Parse response ────────────────────────────────
        JsonNode root = objectMapper.readTree(response.getBody());
        String text   = root.path("content").get(0).path("text").asText();
        String clean  = text.replaceAll("```json", "").replaceAll("```", "").trim();

        return objectMapper.readTree(clean);
    }
}