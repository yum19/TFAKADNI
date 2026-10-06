
// src/main/java/tn/esprit/backend/service/FakeInfoService.java
package tn.esprit.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FakeInfoService {

    private final RestTemplate restTemplate;
    private static final String FLASK_URL = "http://localhost:5000/detect-fake-info";

    /**
     * Calls Flask /detect-fake-info and returns the result map.
     * Returns null on failure.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> analyse(Long postId, String text) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("postId", postId);
            payload.put("text", text);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(FLASK_URL, entity, Map.class);
            return response.getBody();
        } catch (Exception e) {
            log.warn("[FakeInfoService] Flask call failed for postId={}: {}", postId, e.getMessage());
            return null;
        }
    }

    @Async
    public void analyseAsync(Long postId, String text) {
        if (text == null || text.isBlank()) return;
        Map<String, Object> result = analyse(postId, text);
        if (result != null) {
            log.info("[FakeInfoService] postId={} isFakeInfo={} category={}",
                    postId, result.get("isFakeInfo"), result.get("category"));
        }
    }
}