package tn.esprit.backend.entity;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class MlScoringClient {

    private final RestTemplate restTemplate;
    private static final String ML_URL = "http://localhost:5000/score";

    public List<Map<String, Object>> score(List<Map<String, Object>> candidates) {
        //noinspection unchecked
        List<Map<String, Object>> result =
                restTemplate.postForObject(ML_URL, candidates, List.class);
        return result != null ? result : List.of();
    }
}