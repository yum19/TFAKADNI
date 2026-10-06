package tn.esprit.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import tn.esprit.backend.dto.response.ApiResponse;

import java.util.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AiHealthController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GROQ_URL =
            "https://api.groq.com/openai/v1/chat/completions";

    @Value("${groq.api-key:}")
    private String groqKey;

    // ── 1. RAPPORT SANTE ──────────────────────────────────────────────────────

    @PostMapping("/health-report")
    public ResponseEntity<?> generateHealthReport(@RequestBody Map<String, Object> body) {
        double weight = body.get("weight") != null ? ((Number) body.get("weight")).doubleValue() : 0;
        double height = body.get("height") != null ? ((Number) body.get("height")).doubleValue() : 0;
        double bmi    = (height > 0) ? weight / ((height / 100.0) * (height / 100.0)) : 22.0;
        String bmiStatus = bmi < 18.5 ? "Insuffisance ponderale"
                : bmi < 25   ? "Poids normal"
                : bmi < 30   ? "Surpoids" : "Obesite";

        String prompt = new StringBuilder()
                .append("Tu es un assistant medical specialise en sante maternelle. ")
                .append("Reponds UNIQUEMENT avec du JSON valide, sans markdown ni texte autour. ")
                .append("Patiente: age=").append(body.get("age")).append(" ans, ")
                .append("poids=").append(body.get("weight")).append("kg, ")
                .append("taille=").append(body.get("height")).append("cm, ")
                .append("groupe sanguin=").append(body.get("bloodType")).append(", ")
                .append("antecedents=").append(body.get("medicalHistory")).append(". ")
                .append("IMC calcule=").append(String.format("%.1f", bmi)).append(" (").append(bmiStatus).append("). ")
                .append("Genere exactement ce JSON en francais:\n")
                .append("{")
                .append("\"bmi\":").append(String.format("%.1f", bmi)).append(",")
                .append("\"bmiStatus\":\"").append(bmiStatus).append("\",")
                .append("\"summary\":\"REMPLACE PAR 2 phrases bienveillantes sur la sante\",")
                .append("\"recommendations\":[\"conseil1\",\"conseil2\",\"conseil3\",\"conseil4\"],")
                .append("\"alerts\":[],")
                .append("\"nutrition\":\"REMPLACE PAR conseil nutrition grossesse\",")
                .append("\"activity\":\"REMPLACE PAR activite physique adaptee\",")
                .append("\"nextSteps\":\"REMPLACE PAR prochaines etapes medicales\"")
                .append("}")
                .toString();

        return parseAndReturn(callGemini(prompt), "Rapport sante genere");
    }

    // ── 2. HUMEUR ─────────────────────────────────────────────────────────────

    @PostMapping("/mood-analysis")
    public ResponseEntity<?> analyzeMood(@RequestBody Map<String, String> body) {
        String text = body.get("text");
        if (text == null || text.isBlank())
            return ResponseEntity.badRequest().body(ApiResponse.error("Texte requis"));

        String prompt = new StringBuilder()
                .append("Tu es un psychologue bienveillant specialise en sante maternelle. ")
                .append("Reponds UNIQUEMENT avec du JSON valide, sans markdown ni texte autour. ")
                .append("Message de la patiente: ").append(text).append(". ")
                .append("Genere exactement ce JSON en francais:\n")
                .append("{")
                .append("\"mood\":\"REMPLACE PAR humeur principale\",")
                .append("\"moodScore\":5,")
                .append("\"moodEmoji\":\"😊\",")
                .append("\"analysis\":\"REMPLACE PAR analyse empathique 2 phrases\",")
                .append("\"tips\":[\"conseil1\",\"conseil2\",\"conseil3\"],")
                .append("\"affirmation\":\"REMPLACE PAR phrase positive encourageante\",")
                .append("\"needsSupport\":false,")
                .append("\"urgentMessage\":null")
                .append("}")
                .toString();

        return parseAndReturn(callGemini(prompt), "Analyse humeur complete");
    }

    // ── 3. MEDICAMENTS ────────────────────────────────────────────────────────

    @PostMapping("/medication-check")
    public ResponseEntity<?> checkMedications(@RequestBody Map<String, Object> body) {
        String prompt = new StringBuilder()
                .append("Tu es un pharmacien expert en medicaments et grossesse. ")
                .append("Reponds UNIQUEMENT avec du JSON valide, sans markdown ni texte autour. ")
                .append("Semaine de grossesse: ").append(body.get("weekOfPregnancy")).append(". ")
                .append("Medicaments: ").append(body.get("medications")).append(". ")
                .append("Genere exactement ce JSON en francais:\n")
                .append("{")
                .append("\"overallSafety\":\"SAFE\",")
                .append("\"summary\":\"REMPLACE PAR resume 2 phrases\",")
                .append("\"medications\":[{")
                .append("\"name\":\"nom medicament\",")
                .append("\"safety\":\"SAFE\",")
                .append("\"safetyLabel\":\"Sur\",")
                .append("\"risk\":\"description risque\",")
                .append("\"alternative\":null")
                .append("}],")
                .append("\"interactions\":[],")
                .append("\"urgentAlert\":null,")
                .append("\"recommendation\":\"REMPLACE PAR recommandation finale\"")
                .append("}")
                .toString();

        return parseAndReturn(callGemini(prompt), "Analyse medicaments complete");
    }

    // ── 4. AVATAR IA ──────────────────────────────────────────────────────────

    @PostMapping("/avatar-prompt")
    public ResponseEntity<?> generateAvatarPrompt(@RequestBody Map<String, Object> body) {
        String description = (String) body.get("description");
        if (description == null || description.isBlank())
            return ResponseEntity.badRequest().body(ApiResponse.error("Description requise"));

        int seed = body.get("seed") != null
                ? ((Number) body.get("seed")).intValue()
                : Math.abs(description.hashCode());

        String geminiPrompt = new StringBuilder()
                .append("Translate this avatar description to an English image generation prompt. ")
                .append("Description: ").append(description).append(". ")
                .append("Write ONLY the English prompt (max 30 words). ")
                .append("Start with: professional portrait photo of a person with. ")
                .append("Add physical details from description. ")
                .append("End with: photorealistic, high quality, white background.")
                .toString();

        String imagePrompt = callGemini(geminiPrompt);
        if (imagePrompt == null || imagePrompt.isBlank())
            imagePrompt = "professional portrait photo, " + description + ", photorealistic, high quality";
        imagePrompt = imagePrompt.trim().replace("\n", " ");

        try {
            String encodedPrompt = java.net.URLEncoder.encode(imagePrompt, java.nio.charset.StandardCharsets.UTF_8);
            String pollinationsUrl = "https://image.pollinations.ai/prompt/" + encodedPrompt
                    + "?width=512&height=512&nologo=true&seed=" + seed + "&model=flux";

            log.info("[AI Avatar] Fetching: {}", pollinationsUrl);

            ResponseEntity<byte[]> imgResponse = restTemplate.getForEntity(pollinationsUrl, byte[].class);

            if (imgResponse.getStatusCode().is2xxSuccessful() && imgResponse.getBody() != null) {
                String base64  = Base64.getEncoder().encodeToString(imgResponse.getBody());
                String dataUrl = "data:image/jpeg;base64," + base64;

                Map<String, Object> result = new LinkedHashMap<>();
                result.put("avatarUrl", dataUrl);
                result.put("style", "Image generee par IA - Pollinations.ai");
                result.put("colors", List.of("IA generative"));
                result.put("prompt", imagePrompt);
                return ResponseEntity.ok(ApiResponse.ok("Avatar IA genere", result));
            }
        } catch (Exception e) {
            log.error("[AI Avatar] Pollinations error: {}", e.getMessage());
        }

        // Fallback DiceBear
        String fallbackUrl = "https://api.dicebear.com/9.x/avataaars/svg?seed=" + seed + "&backgroundColor=ffd6e0&radius=50";
        Map<String, Object> fallback = new LinkedHashMap<>();
        fallback.put("avatarUrl", fallbackUrl);
        fallback.put("style", "Avatar genere (fallback)");
        fallback.put("colors", List.of("rose"));
        return ResponseEntity.ok(ApiResponse.ok("Avatar genere", fallback));
    }

    // ── Gemini API ────────────────────────────────────────────────────────────

    private Map<String, Object> getMockResponse(String message) {
        if (message.contains("sante") || message.contains("Rapport")) {
            return Map.of(
                    "bmi", 25.0,
                    "bmiStatus", "Surpoids",
                    "summary", "Chere patiente, votre sante est notre priorite. Votre profil montre quelques points d attention que nous allons surveiller ensemble tout au long de votre grossesse.",
                    "recommendations", List.of(
                            "Maintenir un suivi medical regulier avec votre gynecologue.",
                            "Adopter une alimentation equilibree riche en folates et fer.",
                            "Pratiquer une activite physique douce comme la marche ou le yoga prenatal.",
                            "Surveiller votre glycemie regulierement en raison de vos antecedents."
                    ),
                    "alerts", List.of(),
                    "nutrition", "Privilegiez les legumes verts, les legumineuses et les proteines maigres. Evitez les aliments crus et limitez la cafeine.",
                    "activity", "La marche 30 minutes par jour et le yoga prenatal sont vivement recommandes. Evitez les sports de contact.",
                    "nextSteps", "Planifiez votre prochaine echographie et votre bilan sanguin. Consultez un nutritionniste specialise en grossesse."
            );
        }
        if (message.contains("humeur") || message.contains("Analyse")) {
            return Map.of(
                    "mood", "Sereine",
                    "moodScore", 7,
                    "moodEmoji", "😊",
                    "analysis", "Vous semblez dans un etat d esprit positif. Continuer a prendre soin de vous est essentiel pendant cette periode.",
                    "tips", List.of("Pratiquez la respiration profonde.", "Parlez de vos emotions a vos proches.", "Accordez-vous des moments de repos."),
                    "affirmation", "Vous etes forte et capable d accueillir cette nouvelle vie avec amour.",
                    "needsSupport", false,
                    "urgentMessage", null
            );
        }
        if (message.contains("medicament") || message.contains("Verification")) {
            return Map.of(
                    "overallSafety", "Consultez toujours votre medecin avant de prendre tout medicament.",
                    "medications", List.of(),
                    "safeAlternatives", List.of("Paracetamol (en cas de douleur legere)", "Vitamines prenatales prescrites"),
                    "urgentWarning", null
            );
        }
        return null;
    }

    private String callGemini(String prompt) {
        try {
            Map<String, Object> requestBody = Map.of(
                    "model", "llama-3.3-70b-versatile",
                    "messages", List.of(Map.of(
                            "role", "user",
                            "content", prompt
                    )),
                    "temperature", 0.7,
                    "max_tokens", 2000
            );
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqKey);
            String json = objectMapper.writeValueAsString(requestBody);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    GROQ_URL,
                    new HttpEntity<>(json, headers),
                    Map.class
            );
            if (response.getBody() != null) {
                List<?> choices = (List<?>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<?, ?> message = (Map<?, ?>) ((Map<?, ?>) choices.get(0)).get("message");
                    String text = (String) message.get("content");
                    log.info("[AI Groq] OK ({} chars)", text.length());
                    return text;
                }
            }
        } catch (Exception e) {
            log.error("[AI Gemini] Erreur: {}", e.getMessage());
        }
        return null;
    }

    private ResponseEntity<?> parseAndReturn(String json, String message) {
        if (json == null) {
            // ✅ Fallback mock quand Gemini indisponible
            Map<String, Object> mock = getMockResponse(message);
            if (mock != null) return ResponseEntity.ok(ApiResponse.ok(message + " (demo)", mock));
            return ResponseEntity.status(500).body(ApiResponse.error("Service IA temporairement indisponible. Reessayez dans quelques minutes."));
        }
        try {
            String clean = json
                    .replaceAll("(?s)```json\\s*", "")
                    .replaceAll("```\\s*", "")
                    .trim();
            int start = clean.indexOf('{');
            int end   = clean.lastIndexOf('}');
            if (start != -1 && end != -1 && end > start)
                clean = clean.substring(start, end + 1);
            // ✅ Fix: remplacer les virgules décimales françaises par des points
            // ex: 25,0 -> 25.0 dans les valeurs numériques JSON
            clean = clean.replaceAll("(:\\s*-?\\d+),(\\d+)", "$1.$2");
            log.info("[AI] Parsing: {}...", clean.substring(0, Math.min(80, clean.length())));
            Object data = objectMapper.readValue(clean, Object.class);
            return ResponseEntity.ok(ApiResponse.ok(message, data));
        } catch (Exception e) {
            log.error("[AI] Parse error: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.ok(message, Map.of("raw", json)));
        }
    }
}