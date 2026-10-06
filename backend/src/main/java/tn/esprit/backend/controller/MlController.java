package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import tn.esprit.backend.dto.response.ApiResponse;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.entity.HealthProfile;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.repository.HealthProfileRepository;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ml")
@RequiredArgsConstructor
@Slf4j
public class MlController {

    private final UserRepository          userRepository;
    private final HealthProfileRepository healthProfileRepository;
    private final RestTemplate            restTemplate;

    private static final String FLASK_URL = "http://localhost:5000";

    // ── GET /api/ml/health ────────────────────────────────────────────────────
    @GetMapping("/health")
    public ResponseEntity<?> checkFlask() {
        try {
            ResponseEntity<Map> resp = restTemplate.getForEntity(
                    FLASK_URL + "/health", Map.class);
            return ResponseEntity.ok(ApiResponse.ok("Flask ML actif", resp.getBody()));
        } catch (Exception e) {
            return ResponseEntity.status(503)
                    .body(ApiResponse.error("Service ML indisponible : " + e.getMessage()));
        }
    }

    // ── POST /api/ml/predict-phase — prédire le risque de complication ────────
    @PostMapping("/predict-phase")
    public ResponseEntity<?> predictRisk(
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        try {
            User user = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

            // Récupérer le profil santé depuis la BDD
            HealthProfile hp = healthProfileRepository.findByUserId(user.getId())
                    .orElse(null);

            // ✅ Priorité aux données du formulaire (body), fallback profil BDD
            Map<String, Object> flaskBody = new HashMap<>();
            flaskBody.put("age",            body.containsKey("age")            ? body.get("age")            : (hp != null ? hp.getAge()       : 25));
            flaskBody.put("weight_kg",      body.containsKey("weight_kg")      ? body.get("weight_kg")      : (hp != null ? hp.getWeightKg()  : 60.0));
            flaskBody.put("height_cm",      body.containsKey("height_cm")      ? body.get("height_cm")      : (hp != null ? hp.getHeightCm()  : 165));
            flaskBody.put("blood_type",     body.containsKey("blood_type")     ? body.get("blood_type")     : (hp != null ? hp.getBloodType() : "O_POS"));
            flaskBody.put("medical_history", body.containsKey("medical_history") ? body.get("medical_history") : (hp != null ? parseMedicalHistory(hp.getMedicalHistoryJson()) : "aucun"));

            log.info("[ML] Sending to Flask: {}", flaskBody);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(flaskBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    FLASK_URL + "/predict", request, Map.class);

            log.info("[ML] Risque prédit pour {} : {}", user.getEmail(),
                    response.getBody() != null ? response.getBody().get("risk") : "null");

            return ResponseEntity.ok(ApiResponse.ok("Analyse de risque ML", response.getBody()));

        } catch (Exception e) {
            log.error("[ML] Erreur : {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Erreur ML : " + e.getMessage()));
        }
    }

    private String parseMedicalHistory(String json) {
        if (json == null || json.isEmpty()) return "aucun";
        try {
            boolean diabete = json.contains("diabete") || json.contains("diabète");
            boolean hypert  = json.contains("hypertension");
            if (diabete && hypert) return "diabete_hypertension";
            if (diabete)           return "diabete";
            if (hypert)            return "hypertension";
            return "aucun";
        } catch (Exception e) { return "aucun"; }
    }
}