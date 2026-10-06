package tn.esprit.backend.module6b.service.impl.healing;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.module6b.dto.healing.*;
import tn.esprit.backend.module6b.entity.healing.HealingMission;
import tn.esprit.backend.module6b.entity.healing.MissionType;
import tn.esprit.backend.module6b.repository.healing.HealingMissionRepository;
import tn.esprit.backend.module6b.service.healing.IVoiceAnalysisClient;
import tn.esprit.backend.module6b.service.healing.IVoiceComfortEvaluationService;
import tn.esprit.backend.repository.UserRepository;

import java.io.IOException;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VoiceComfortEvaluationServiceImpl implements IVoiceComfortEvaluationService {

    private final UserRepository userRepository;
    private final HealingMissionRepository healingMissionRepository;
    private final IVoiceAnalysisClient voiceAnalysisClient;

    @Override
    public VoiceMissionConfigResponseDto getVoiceMissionConfig(String email, Long missionId) {
        getUserByEmail(email);
        HealingMission mission = getVoiceMissionOrThrow(missionId);

        return VoiceMissionConfigResponseDto.builder()
                .missionId(mission.getId())
                .expectedText(mission.getExpectedText())
                .expectedVoiceStyle(
                        mission.getExpectedVoiceStyle() != null ? mission.getExpectedVoiceStyle().name() : null
                )
                .minimumPassingScore(mission.getMinimumPassingScore())
                .referenceAudioUrl(mission.getMediaUrl())
                .build();
    }

    @Override
    public VoiceEvaluationResponseDto evaluateVoiceMission(String email, Long missionId, MultipartFile audio) {
        getUserByEmail(email);
        HealingMission mission = getVoiceMissionOrThrow(missionId);

        validateAudio(audio, mission);

        VoiceAnalysisRequestDto request = VoiceAnalysisRequestDto.builder()
                .expectedText(mission.getExpectedText())
                .expectedVoiceStyle(mission.getExpectedVoiceStyle().name())
                .minimumPassingScore(mission.getMinimumPassingScore())
                .audioBase64(toBase64(audio))
                .originalFilename(audio.getOriginalFilename())
                .contentType(audio.getContentType())
                .build();

        VoiceAnalysisResultDto result = voiceAnalysisClient.analyze(request);

        return VoiceEvaluationResponseDto.builder()
                .missionId(mission.getId())
                .expectedText(mission.getExpectedText())
                .expectedVoiceStyle(mission.getExpectedVoiceStyle().name())
                .detectedVoiceStyle(result.getDetectedVoiceStyle())
                .transcript(result.getTranscript())
                .textScore(result.getTextScore())
                .energyScore(result.getEnergyScore())
                .paceScore(result.getPaceScore())
                .stabilityScore(result.getStabilityScore())
                .pitchScore(result.getPitchScore())
                .finalScore(result.getFinalScore())
                .accepted(result.getAccepted())
                .feedback(result.getFeedback())
                .build();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    private HealingMission getVoiceMissionOrThrow(Long missionId) {
        HealingMission mission = healingMissionRepository.findById(missionId)
                .orElseThrow(() -> new RuntimeException("Healing mission not found with id: " + missionId));

        if (mission.getMissionType() != MissionType.VOICE_COMFORT) {
            throw new IllegalArgumentException("This mission is not a VOICE_COMFORT mission");
        }

        if (mission.getExpectedVoiceStyle() == null) {
            throw new IllegalStateException("Expected voice style is not configured");
        }

        if (mission.getExpectedText() == null || mission.getExpectedText().isBlank()) {
            throw new IllegalStateException("Expected text is not configured");
        }

        if (mission.getMinimumPassingScore() == null) {
            throw new IllegalStateException("Minimum passing score is not configured");
        }

        return mission;
    }

    private void validateAudio(MultipartFile audio, HealingMission mission) {
        if (audio == null || audio.isEmpty()) {
            throw new IllegalArgumentException("Audio file is required");
        }

        String contentType = audio.getContentType();
        if (contentType == null) {
            throw new IllegalArgumentException("Audio content type is missing");
        }

        String normalized = contentType.toLowerCase();
        if (!(normalized.contains("audio") || normalized.contains("webm") || normalized.contains("ogg"))) {
            throw new IllegalArgumentException("Unsupported audio format: " + contentType);
        }
    }

    private String toBase64(MultipartFile audio) {
        try {
            return Base64.getEncoder().encodeToString(audio.getBytes());
        } catch (IOException e) {
            throw new RuntimeException("Unable to read uploaded audio", e);
        }
    }
}