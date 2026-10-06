package tn.esprit.backend.module6b.service.healing;

import org.springframework.web.multipart.MultipartFile;
import tn.esprit.backend.module6b.dto.healing.VoiceEvaluationResponseDto;
import tn.esprit.backend.module6b.dto.healing.VoiceMissionConfigResponseDto;

public interface IVoiceComfortEvaluationService {

    VoiceMissionConfigResponseDto getVoiceMissionConfig(String email, Long missionId);

    VoiceEvaluationResponseDto evaluateVoiceMission(
            String email,
            Long missionId,
            MultipartFile audio
    );
}