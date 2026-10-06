package tn.esprit.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AiFetalController {

    @Value("${anthropic.api.key}")
    private String anthropicApiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

    // Secured: Only authenticated mothers (USER) or ADMINs should generate this data
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @PostMapping("/generate-fetal")
    public ResponseEntity<?> generateFetal(@RequestBody Map<String, Object> body) {
        try {
            Integer weekNumber = (Integer) body.get("weekNumber");
            if (weekNumber == null || weekNumber < 1 || weekNumber > 40) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid week number"));
            }

            String trimester = weekNumber <= 12 ? "T1" : weekNumber <= 26 ? "T2" : "T3";
            String trimLabel = weekNumber <= 12 ? "Trimester 1 (weeks 1-12)"
                    : weekNumber <= 26 ? "Trimester 2 (weeks 13-26)"
                    : "Trimester 3 (weeks 27-40)";

            String prompt = String.format("""
                You are a medical expert in prenatal care. Generate detailed fetal development content for week %d of pregnancy (%s).

                Return ONLY a valid JSON object with exactly these fields (no markdown, no explanation, no code block):
                {
                  "title": "Short title for week %d fetal development (max 8 words)",
                  "description": "Detailed paragraph about fetal development at week %d (3-4 sentences, medically accurate)",
                  "sizeCm": <number in cm, realistic for week %d>,
                  "weightG": <number in grams, realistic for week %d>,
                  "sizeComparison": "Comparison to a fruit or vegetable",
                  "motherSymptoms": "Common symptoms the mother experiences at week %d (2-3 sentences)",
                  "medicalAdvice": "Medical advice and recommended exams for week %d (2-3 sentences)"
                }
                """,
                    weekNumber, trimLabel,
                    weekNumber, weekNumber, weekNumber, weekNumber, weekNumber, weekNumber
            );

            // Build Anthropic API request body
            Map<String, Object> message = Map.of("role", "user", "content", prompt);
            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("model", "claude-sonnet-4-20250514"); // Note: You might want to update this to claude-3-5-sonnet-20240620 later!
            requestBody.put("max_tokens", 1000);
            requestBody.put("messages", List.of(message));

            // Set headers with API key
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key", anthropicApiKey);
            headers.set("anthropic-version", "2023-06-01");

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(ANTHROPIC_URL, request, String.class);

            // Parse Anthropic response
            JsonNode root = objectMapper.readTree(response.getBody());
            String text = root.path("content").get(0).path("text").asText();

            // Clean and parse JSON from Claude
            String cleanJson = text.replaceAll("```json", "").replaceAll("```", "").trim();
            JsonNode parsed = objectMapper.readTree(cleanJson);

            // Build clean response
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("weekNumber", weekNumber);
            result.put("trimester", trimester);
            result.put("title",          parsed.path("title").asText());
            result.put("description",    parsed.path("description").asText());
            result.put("sizeCm",         parsed.path("sizeCm").isNull() ? null : parsed.path("sizeCm").asDouble());
            result.put("weightG",        parsed.path("weightG").isNull() ? null : parsed.path("weightG").asDouble());
            result.put("sizeComparison", parsed.path("sizeComparison").asText());
            result.put("motherSymptoms", parsed.path("motherSymptoms").asText());
            result.put("medicalAdvice",  parsed.path("medicalAdvice").asText());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Generation failed: " + e.getMessage()));
        }
    }
}