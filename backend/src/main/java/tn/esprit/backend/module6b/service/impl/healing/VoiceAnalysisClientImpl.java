package tn.esprit.backend.module6b.service.impl.healing;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tn.esprit.backend.module6b.dto.healing.VoiceAnalysisRequestDto;
import tn.esprit.backend.module6b.dto.healing.VoiceAnalysisResultDto;
import tn.esprit.backend.module6b.service.healing.IVoiceAnalysisClient;

@Service
@RequiredArgsConstructor
public class VoiceAnalysisClientImpl implements IVoiceAnalysisClient {

    private final RestTemplate restTemplate;

    @Value("${voice.analysis.base-url}")
    private String voiceAnalysisBaseUrl;

    @Override
    public VoiceAnalysisResultDto analyze(VoiceAnalysisRequestDto request) {
        String url = voiceAnalysisBaseUrl + "/analyze-voice-style";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<VoiceAnalysisRequestDto> entity = new HttpEntity<>(request, headers);

        ResponseEntity<VoiceAnalysisResultDto> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                VoiceAnalysisResultDto.class
        );

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Voice analysis service returned an invalid response");
        }

        return response.getBody();
    }
}