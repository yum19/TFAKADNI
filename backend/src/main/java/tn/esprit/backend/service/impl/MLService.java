package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tn.esprit.backend.dto.request.VitalsMLRequest;
import tn.esprit.backend.dto.response.MLPredictionResponse;

@Slf4j
@Service
@RequiredArgsConstructor
public class MLService {

    private final RestTemplate restTemplate;

    private static final String FLASK_URL = "http://localhost:5001/api/predict";

    public MLPredictionResponse predict(VitalsMLRequest request) {
        try {
            MLPredictionResponse response = restTemplate.postForObject(
                    FLASK_URL,
                    request,
                    MLPredictionResponse.class
            );
            log.info("ML prediction: risk={}, score={}", response.getRiskLevel(), response.getRiskScore());
            return response;
        } catch (Exception e) {
            log.error("ML service unreachable: {}", e.getMessage());
            throw new RuntimeException("ML service is currently unavailable. Please try again later.");
        }
    }
}
