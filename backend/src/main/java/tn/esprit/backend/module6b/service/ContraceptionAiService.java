package tn.esprit.backend.module6b.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ContraceptionAiService {

    @Value("${groq-ikbel.api.key}")
    private String groqApiKey;

    private static final String GROQ_API_URL =
            "https://api.groq.com/openai/v1/chat/completions";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    private enum Language {
        ENGLISH,
        FRENCH,
        ARABIC
    }

    private static final Set<String> FRENCH_HINTS = Set.of(
            "bonjour", "bonsoir", "salut", "merci", "allaitement", "enceinte",
            "contraception", "méthode", "methode", "préférence", "preference",
            "antécédents", "antecedents", "douleur", "pilule", "stérilet",
            "sterilet", "implant", "injection", "post-partum", "pourquoi",
            "recommande", "recommandes", "femme", "médecin", "medecin"
    );

    private static final Set<String> ENGLISH_HINTS = Set.of(
            "hello", "hi", "thanks", "thank you", "breastfeeding", "contraception",
            "method", "preference", "medical history", "pain", "pill", "iud",
            "implant", "injection", "postpartum", "why", "recommend", "doctor",
            "woman", "mother"
    );

    public String recommendContraceptionMethod(
            String age,
            Boolean isBreastfeeding,
            String medicalHistory,
            String preference
    ) {
        Language language = detectLanguageFromProfile(age, isBreastfeeding, medicalHistory, preference);
        String systemPrompt = buildRecommendationSystemPrompt(language);
        String userMessage = buildRecommendationPrompt(age, isBreastfeeding, medicalHistory, preference, language);

        return callGroqApi(systemPrompt, userMessage, language);
    }

    public String chat(List<Map<String, String>> conversationHistory) {
        Language language = detectLanguageFromConversation(conversationHistory);
        String systemPrompt = buildChatSystemPrompt(language);

        StringBuilder userPrompt = new StringBuilder();

        int start = Math.max(0, conversationHistory.size() - 5);
        List<Map<String, String>> recent = conversationHistory.subList(start, conversationHistory.size());

        for (Map<String, String> msg : recent) {
            String role = "assistant".equalsIgnoreCase(msg.get("role")) ? "Assistant" : "User";
            userPrompt.append(role)
                    .append(": ")
                    .append(msg.getOrDefault("content", ""))
                    .append("\n");
        }

        userPrompt.append("Assistant: ");
        return callGroqApi(systemPrompt, userPrompt.toString(), language);
    }

    private String buildRecommendationPrompt(
            String age,
            Boolean isBreastfeeding,
            String medicalHistory,
            String preference,
            Language language
    ) {
        StringBuilder sb = new StringBuilder();

        switch (language) {
            case ARABIC -> {
                sb.append("إليك ملفي الشخصي: ");
                sb.append("العمر: ").append(safe(age)).append(". ");
                sb.append("الرضاعة الطبيعية: ")
                        .append(Boolean.TRUE.equals(isBreastfeeding) ? "نعم" : "لا")
                        .append(". ");

                if (medicalHistory != null && !medicalHistory.isBlank()) {
                    sb.append("التاريخ الطبي: ").append(medicalHistory).append(". ");
                }
                if (preference != null && !preference.isBlank()) {
                    sb.append("التفضيل: ").append(preference).append(". ");
                }

                sb.append("ما وسيلة منع الحمل التي تنصحني بها ولماذا؟");
            }

            case FRENCH -> {
                sb.append("Voici mon profil : ");
                sb.append("Âge : ").append(safe(age)).append(". ");
                sb.append("Allaitement : ")
                        .append(Boolean.TRUE.equals(isBreastfeeding) ? "oui" : "non")
                        .append(". ");

                if (medicalHistory != null && !medicalHistory.isBlank()) {
                    sb.append("Antécédents : ").append(medicalHistory).append(". ");
                }
                if (preference != null && !preference.isBlank()) {
                    sb.append("Préférence : ").append(preference).append(". ");
                }

                sb.append("Quelle méthode contraceptive me recommandes-tu et pourquoi ?");
            }

            default -> {
                sb.append("Here is my profile: ");
                sb.append("Age: ").append(safe(age)).append(". ");
                sb.append("Breastfeeding: ")
                        .append(Boolean.TRUE.equals(isBreastfeeding) ? "yes" : "no")
                        .append(". ");

                if (medicalHistory != null && !medicalHistory.isBlank()) {
                    sb.append("Medical history: ").append(medicalHistory).append(". ");
                }
                if (preference != null && !preference.isBlank()) {
                    sb.append("Preference: ").append(preference).append(". ");
                }

                sb.append("What contraceptive method do you recommend and why?");
            }
        }

        return sb.toString();
    }

    private String buildRecommendationSystemPrompt(Language language) {
        return switch (language) {
            case ARABIC ->
                    "أنتِ مساعدة طبية لطيفة ومتخصصة في صحة الأم ووسائل منع الحمل بعد الولادة. "
                            + "أجيبي بالعربية بشكل واضح في 5 إلى 8 أسطر كحد أقصى. "
                            + "لا تضعي تشخيصاً. "
                            + "قدمي توصية عامة حسب المعطيات المذكورة، واذكري بإيجاز السبب أو المزايا والاحتياطات إن لزم. "
                            + "اختمي دائماً بنصيحة مراجعة الطبيب أو الطبيبة للتأكد من أن الوسيلة مناسبة.";

            case FRENCH ->
                    "Tu es une assistante médicale bienveillante spécialisée en santé maternelle "
                            + "et contraception post-partum. "
                            + "Réponds en français, clairement, en 5 à 8 lignes maximum. "
                            + "Ne pose pas de diagnostic. "
                            + "Donne une recommandation générale selon les informations fournies, "
                            + "avec une brève explication des avantages ou précautions si nécessaire. "
                            + "Termine toujours en conseillant de valider avec un médecin.";

            default ->
                    "You are a kind medical assistant specialized in maternal health and postpartum contraception. "
                            + "Respond in English, clearly, in 5 to 8 lines maximum. "
                            + "Do not make a diagnosis. "
                            + "Provide a general recommendation based on the information given, "
                            + "with a short explanation of benefits or precautions if needed. "
                            + "Always end by advising the user to confirm with a doctor.";
        };
    }

    private String buildChatSystemPrompt(Language language) {
        return switch (language) {
            case ARABIC ->
                    "أنتِ مساعدة طبية لطيفة ومتخصصة في وسائل منع الحمل بعد الولادة. "
                            + "أجيبي بالعربية بتعاطف وبأسلوب بسيط في 2 إلى 4 جمل كحد أقصى. "
                            + "لا تضعي تشخيصاً، ووجهي المستخدم إلى مختص عند الحاجة.";

            case FRENCH ->
                    "Tu es une assistante médicale bienveillante spécialisée en contraception post-partum. "
                            + "Réponds en français avec empathie, simplement, en 2 à 4 phrases maximum. "
                            + "Ne pose pas de diagnostic et oriente vers un professionnel si nécessaire.";

            default ->
                    "You are a kind medical assistant specialized in postpartum contraception. "
                            + "Respond in English with empathy, simply, in 2 to 4 sentences maximum. "
                            + "Do not make a diagnosis and guide the user to a professional if necessary.";
        };
    }

    private Language detectLanguageFromProfile(
            String age,
            Boolean isBreastfeeding,
            String medicalHistory,
            String preference
    ) {
        String text = String.join(" ",
                safe(age),
                safe(medicalHistory),
                safe(preference),
                Boolean.TRUE.equals(isBreastfeeding) ? "yes breastfeeding" : "no breastfeeding"
        );

        return detectLanguage(text);
    }

    private Language detectLanguageFromConversation(List<Map<String, String>> conversationHistory) {
        if (conversationHistory == null || conversationHistory.isEmpty()) {
            return Language.ENGLISH;
        }

        for (int i = conversationHistory.size() - 1; i >= 0; i--) {
            Map<String, String> msg = conversationHistory.get(i);
            String role = msg.getOrDefault("role", "");
            if ("user".equalsIgnoreCase(role)) {
                String content = msg.getOrDefault("content", "");
                if (!content.isBlank()) {
                    return detectLanguage(content);
                }
            }
        }

        StringBuilder merged = new StringBuilder();
        int start = Math.max(0, conversationHistory.size() - 5);
        for (int i = start; i < conversationHistory.size(); i++) {
            merged.append(conversationHistory.get(i).getOrDefault("content", "")).append(" ");
        }

        return detectLanguage(merged.toString());
    }

    private Language detectLanguage(String text) {
        if (text == null || text.isBlank()) {
            return Language.ENGLISH;
        }

        String normalized = text.toLowerCase();

        if (containsArabic(normalized)) {
            return Language.ARABIC;
        }

        int frenchScore = scoreLanguageHints(normalized, FRENCH_HINTS)
                + countFrenchCharacters(normalized);

        int englishScore = scoreLanguageHints(normalized, ENGLISH_HINTS);

        if (frenchScore > englishScore) {
            return Language.FRENCH;
        }

        return Language.ENGLISH;
    }

    private int scoreLanguageHints(String text, Set<String> hints) {
        int score = 0;
        for (String hint : hints) {
            if (text.contains(hint)) {
                score++;
            }
        }
        return score;
    }

    private int countFrenchCharacters(String text) {
        int score = 0;
        String frenchChars = "àâçéèêëîïôùûüÿœæ";
        for (char c : text.toCharArray()) {
            if (frenchChars.indexOf(c) >= 0) {
                score++;
            }
        }
        return score;
    }

    private boolean containsArabic(String text) {
        for (char c : text.toCharArray()) {
            if (c >= '\u0600' && c <= '\u06FF') {
                return true;
            }
        }
        return false;
    }

    private String callGroqApi(String systemPrompt, String userPrompt, Language language) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);

            Map<String, Object> requestBody = Map.of(
                    "model", "llama-3.1-8b-instant",
                    "max_tokens", 500,
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", userPrompt)
                    )
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            System.out.println("🚀 Sending request to Groq...");
            ResponseEntity<String> response = restTemplate.postForEntity(
                    GROQ_API_URL, entity, String.class
            );

            System.out.println("🔥 FULL RESPONSE = " + response.getBody());

            JsonNode root = objectMapper.readTree(response.getBody());
            String text = root.path("choices").get(0)
                    .path("message").path("content").asText();

            System.out.println("✅ Groq response = " + text);
            return text;

        } catch (Exception e) {
            System.out.println("❌ ERROR calling Groq:");
            e.printStackTrace();
            return fallbackMessage(language);
        }
    }

    private String fallbackMessage(Language language) {
        return switch (language) {
            case ARABIC ->
                    "أنصحكِ بمراجعة الطبيب أو الطبيبة لاختيار وسيلة منع الحمل الأنسب لحالتك.";
            case FRENCH ->
                    "Je vous recommande de consulter votre médecin pour choisir la méthode contraceptive la plus adaptée à votre situation.";
            default ->
                    "I recommend consulting your doctor to choose the contraceptive method that is most suitable for your situation.";
        };
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}