package tn.esprit.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class GroqService {

    @Value("${groq-yomna.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String GROQ_URL =
            "https://api.groq.com/openai/v1/chat/completions";

    private static final Map<String, String> TAG_CONTEXT = Map.of(
            "GROSSESSE",  "pregnancy and prenatal care",
            "POSTPARTUM", "postpartum recovery and new motherhood",
            "FERTILITE",  "fertility, conception and reproductive health",
            "NUTRITION",  "nutrition during pregnancy and motherhood"
    );

    @Cacheable(value = "groq-posts", key = "#tag + '_' + #topic.toLowerCase().trim()")
    public String generatePost(String topic, String tag) {
        System.out.println("=== Groq called === topic: " + topic + " | tag: " + tag);

        if (apiKey == null || apiKey.isBlank() || apiKey.equals("YOUR_GROQ_KEY_HERE")) {
            return "⚠️ Groq API key not configured in application.properties.";
        }

        String context = TAG_CONTEXT.getOrDefault(tag, "women's health");

        String prompt = "You are a supportive community member on a women's health social platform.\n" +
                "The user has written: \"" + topic + "\"\n\n" +
                "Expand this into a warm, authentic, first-person social media post about " + context + ".\n" +
                "Requirements:\n" +
                "- Keep their original ideas but make it fuller (4-6 sentences)\n" +
                "- Conversational and empathetic tone\n" +
                "- End with an encouraging note or question to the community\n" +
                "- NO hashtags, NO emojis, NO quotes around the output\n" +
                "- Return ONLY the post text, nothing else";

        Map<String, Object> message = Map.of(
                "role", "user",
                "content", prompt
        );

        Map<String, Object> requestBody = Map.of(
                "model", "llama-3.3-70b-versatile",
                "messages", List.of(message),
                "max_tokens", 250,
                "temperature", 0.85
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(GROQ_URL, entity, Map.class);

            System.out.println("=== Groq status: " + response.getStatusCode());

            Map body = response.getBody();
            if (body == null) return "Error: empty response from Groq.";

            List<?> choices = (List<?>) body.get("choices");
            if (choices == null || choices.isEmpty()) return "The AI returned no content.";

            Map<?, ?> choice = (Map<?, ?>) choices.get(0);
            Map<?, ?> messageResponse = (Map<?, ?>) choice.get("message");
            String result = messageResponse.get("content").toString().trim();

            System.out.println("=== Groq result: " + result);
            return result;

        } catch (HttpClientErrorException e) {
            System.err.println("=== Groq HTTP error: " + e.getStatusCode() + " — " + e.getResponseBodyAsString());
            if (e.getStatusCode().value() == 429) {
                throw new RuntimeException("RATE_LIMIT");
            }
            if (e.getStatusCode().value() == 401) {
                return "Invalid Groq API key. Please check application.properties.";
            }
            throw new RuntimeException("API_ERROR");
        } catch (Exception e) {
            System.err.println("=== Groq error: " + e.getMessage());
            throw new RuntimeException("API_ERROR");
        }
    }
}