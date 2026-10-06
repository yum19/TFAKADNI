package tn.esprit.backend.module6b.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import tn.esprit.backend.module6b.service.StoryAudioGeneratorService;

import java.io.File;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StoryAudioGeneratorServiceImpl implements StoryAudioGeneratorService {

    // Injected RestTemplate instead of WebClient
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${elevenlabs.api.base-url}")
    private String baseUrl;

    @Value("${elevenlabs.api.key}")
    private String apiKey;

    @Value("${elevenlabs.model.id}")
    private String modelId;

    @Value("${storytelling.audio.storage}")
    private String storagePath;

    @Override
    public String generateAudioFile(Long storyId, String text, String voiceType) {
        try {
            // 1. Créer le dossier de stockage si nécessaire
            File folder = new File(storagePath);
            if (!folder.exists() && !folder.mkdirs()) {
                throw new RuntimeException("Impossible de créer le dossier audio: " + storagePath);
            }

            String fileName = "story-" + storyId + ".mp3";
            File outputFile = new File(folder, fileName);

            // 2. Voice ID ElevenLabs (Sarah - stable)
            String voiceId = "EXAVITQu4vr4xnSDxMaL";

            // 3. Tronquer le texte si nécessaire
            String safeText = sanitizeText(text);

            // 4. Construire le body JSON proprement via ObjectMapper
            Map<String, Object> voiceSettings = new LinkedHashMap<>();
            voiceSettings.put("stability", 0.72);
            voiceSettings.put("similarity_boost", 0.85);
            voiceSettings.put("style", 0.18);
            voiceSettings.put("speed", 0.92);
            voiceSettings.put("use_speaker_boost", true);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("text", safeText);
            body.put("model_id", modelId);
            body.put("voice_settings", voiceSettings);

            String requestBody = objectMapper.writeValueAsString(body);

            // 5. Configurer les Headers pour RestTemplate
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_OCTET_STREAM));
            headers.set("xi-api-key", apiKey.trim());

            // 6. Créer l'entité de la requête
            HttpEntity<String> requestEntity = new HttpEntity<>(requestBody, headers);

            // 7. Appel ElevenLabs via RestTemplate
            String url = baseUrl + "/v1/text-to-speech/" + voiceId + "?output_format=mp3_44100_128";

            ResponseEntity<byte[]> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    byte[].class
            );

            byte[] audio = response.getBody();

            if (audio == null || audio.length == 0) {
                throw new RuntimeException("ElevenLabs a retourné un audio vide");
            }

            // 8. Sauvegarder le fichier
            FileUtils.writeByteArrayToFile(outputFile, audio);

            return "/api/postpartum/storytelling/audio-files/" + fileName;

        } catch (HttpStatusCodeException e) {
            // Gestion des erreurs HTTP (4xx, 5xx) avec RestTemplate
            String responseBody = e.getResponseBodyAsString();
            throw new RuntimeException(
                    "Erreur ElevenLabs HTTP " + e.getStatusCode().value() + " : " + responseBody, e
            );
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération audio: " + e.getMessage(), e);
        }
    }

    private String sanitizeText(String text) {
        if (text == null) {
            return "";
        }

        // Supprimer les caractères de contrôle problématiques
        String cleaned = text
                .replace("\r\n", " ")
                .replace("\n", " ")
                .replace("\r", " ")
                .replace("\t", " ")
                .trim();

        // Limiter la longueur pour le quota ElevenLabs
        if (cleaned.length() > 2400) {
            cleaned = cleaned.substring(0, 2400).trim();
        }

        return cleaned;
    }
}