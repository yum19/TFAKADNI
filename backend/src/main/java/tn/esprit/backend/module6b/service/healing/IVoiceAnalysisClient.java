package tn.esprit.backend.module6b.service.healing;

import tn.esprit.backend.module6b.dto.healing.VoiceAnalysisRequestDto;
import tn.esprit.backend.module6b.dto.healing.VoiceAnalysisResultDto;

public interface IVoiceAnalysisClient {
    VoiceAnalysisResultDto analyze(VoiceAnalysisRequestDto request);
}