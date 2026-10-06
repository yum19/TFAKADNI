package tn.esprit.backend.module6b.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.module6b.dto.PredictionResultResponseDto;
import tn.esprit.backend.module6b.dto.ScreeningAssessmentRequestDto;
import tn.esprit.backend.module6b.dto.ScreeningAssessmentResponseDto;
import tn.esprit.backend.module6b.entity.PredictionResult;
import tn.esprit.backend.module6b.entity.ScreeningAssessment;
import tn.esprit.backend.module6b.exception.PostpartumAccountContextException;
import tn.esprit.backend.module6b.exception.PostpartumAiBridgeException;
import tn.esprit.backend.module6b.exception.PostpartumOwnershipException;
import tn.esprit.backend.module6b.exception.PostpartumRecordMissingException;
import tn.esprit.backend.module6b.repository.PredictionResultRepository;
import tn.esprit.backend.module6b.repository.PsychAppointmentRepository;
import tn.esprit.backend.module6b.repository.ScreeningAssessmentRepository;
import tn.esprit.backend.module6b.service.IScreeningService;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class ScreeningServiceImpl implements IScreeningService {

    private final ScreeningAssessmentRepository screeningRepository;
    private final PredictionResultRepository predictionRepository;
    private final PsychAppointmentRepository psychAppointmentRepository;
    private final UserRepository userRepository;

    @Override
    public PredictionResultResponseDto createScreening(String email, ScreeningAssessmentRequestDto dto) {
        User user = getUserByEmail(email);

        ScreeningAssessment screening = ScreeningAssessment.builder()
                .mother(user)
                .assessmentDate(LocalDateTime.now())
                .age(dto.getAge())
                .feelingSadOrTearful(dto.getFeelingSadOrTearful())
                .irritableTowardsBabyPartner(dto.getIrritableTowardsBabyPartner())
                .troubleSleepingAtNight(dto.getTroubleSleepingAtNight())
                .problemsConcentratingOrMakingDecision(dto.getProblemsConcentratingOrMakingDecision())
                .overeatingOrLossOfAppetite(dto.getOvereatingOrLossOfAppetite())
                .feelingAnxious(dto.getFeelingAnxious())
                .feelingOfGuilt(dto.getFeelingOfGuilt())
                .problemsOfBondingWithBaby(dto.getProblemsOfBondingWithBaby())
                .suicideAttempt(dto.getSuicideAttempt())
                .sharedWithDoctor(dto.getSharedWithDoctor())
                .createdAt(LocalDateTime.now())
                .build();

        ScreeningAssessment savedScreening = screeningRepository.save(screening);

        Map<String, Object> requestBody = Map.of(
                "age", savedScreening.getAge(),
                "feelingSadOrTearful", savedScreening.getFeelingSadOrTearful(),
                "irritableTowardsBabyPartner", savedScreening.getIrritableTowardsBabyPartner(),
                "troubleSleepingAtNight", savedScreening.getTroubleSleepingAtNight(),
                "problemsConcentratingOrMakingDecision", savedScreening.getProblemsConcentratingOrMakingDecision(),
                "overeatingOrLossOfAppetite", savedScreening.getOvereatingOrLossOfAppetite(),
                "feelingAnxious", savedScreening.getFeelingAnxious(),
                "feelingOfGuilt", savedScreening.getFeelingOfGuilt(),
                "problemsOfBondingWithBaby", savedScreening.getProblemsOfBondingWithBaby(),
                "suicideAttempt", savedScreening.getSuicideAttempt()
        );

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                "http://localhost:5002/predict",
                entity,
                Map.class
        );

        Map<String, Object> responseBody = response.getBody();
        if (responseBody == null) {
            throw new PostpartumAiBridgeException("Empty response from AI prediction service");
        }

        Integer riskLabel = ((Number) responseBody.get("riskLabel")).intValue();
        String riskLevel = (String) responseBody.get("riskLevel");
        Double confidence = ((Number) responseBody.get("confidence")).doubleValue();

        Map<String, Object> probabilities = (Map<String, Object>) responseBody.get("probabilities");

        Double probabilityLow = ((Number) probabilities.get("low")).doubleValue();
        Double probabilityModerate = ((Number) probabilities.get("moderate")).doubleValue();
        Double probabilityHigh = ((Number) probabilities.get("high")).doubleValue();

        PredictionResult prediction = PredictionResult.builder()
                .screeningAssessment(savedScreening)
                .riskLabel(riskLabel)
                .riskLevel(riskLevel)
                .confidence(confidence)
                .probabilityLow(probabilityLow)
                .probabilityModerate(probabilityModerate)
                .probabilityHigh(probabilityHigh)
                .predictionDate(LocalDateTime.now())
                .modelVersion("IA-v1")
                .build();

        savedScreening.setPredictionResult(prediction);

        return mapPredictionToResponse(predictionRepository.save(prediction));
    }

    @Override
    public List<ScreeningAssessmentResponseDto> getScreeningsByMother(String email) {
        User user = getUserByEmail(email);
        return screeningRepository.findByMotherIdOrderByAssessmentDateDesc(user.getId())
                .stream()
                .map(this::mapScreeningToResponse)
                .toList();
    }

    @Override
    public ScreeningAssessmentResponseDto getScreeningById(String email, Long id) {
        User user = getUserByEmail(email);
        ScreeningAssessment screening = screeningRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("Screening not found with id: " + id));

        checkOwner(screening.getMother().getId(), user.getId());
        return mapScreeningToResponse(screening);
    }

    @Override
    public ScreeningAssessmentResponseDto getLatestScreeningByMother(String email) {
        User user = getUserByEmail(email);
        ScreeningAssessment screening = screeningRepository.findTopByMotherIdOrderByAssessmentDateDesc(user.getId())
                .orElseThrow(() -> new PostpartumRecordMissingException("No screening found"));
        return mapScreeningToResponse(screening);
    }

    @Override
    public void deleteScreening(String email, Long id) {
        User user = getUserByEmail(email);

        ScreeningAssessment screening = screeningRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("Screening not found with id: " + id));

        checkOwner(screening.getMother().getId(), user.getId());

        PredictionResult prediction = screening.getPredictionResult();

        if (prediction != null) {
            Long predictionId = prediction.getId();

            // 1) supprimer d'abord les rendez-vous psy liés au prediction result
            psychAppointmentRepository.deleteByPredictionResultId(predictionId);

            // 2) casser la relation screening <-> prediction
            screening.setPredictionResult(null);

            // 3) supprimer le prediction result
            predictionRepository.delete(prediction);
            predictionRepository.flush();
        }

        // 4) supprimer le screening
        screeningRepository.delete(screening);
        screeningRepository.flush();
    }

    @Override
    public List<PredictionResultResponseDto> getPredictionsByMother(String email) {
        User user = getUserByEmail(email);
        return predictionRepository.findByScreeningAssessmentMotherIdOrderByPredictionDateDesc(user.getId())
                .stream()
                .map(this::mapPredictionToResponse)
                .toList();
    }

    @Override
    public PredictionResultResponseDto getPredictionById(String email, Long id) {
        User user = getUserByEmail(email);
        PredictionResult prediction = predictionRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("Prediction not found with id: " + id));

        checkOwner(prediction.getScreeningAssessment().getMother().getId(), user.getId());
        return mapPredictionToResponse(prediction);
    }

    @Override
    public PredictionResultResponseDto getLatestPredictionByMother(String email) {
        User user = getUserByEmail(email);
        PredictionResult prediction = predictionRepository.findTopByScreeningAssessmentMotherIdOrderByPredictionDateDesc(user.getId())
                .orElseThrow(() -> new PostpartumRecordMissingException("No prediction found"));
        return mapPredictionToResponse(prediction);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new PostpartumAccountContextException("Authenticated postpartum user not found"));
    }

    private void checkOwner(Long ownerId, Long currentUserId) {
        if (ownerId == null || !ownerId.equals(currentUserId)) {
            throw new PostpartumOwnershipException("You are not allowed to access this postpartum resource");
        }
    }

    private ScreeningAssessmentResponseDto mapScreeningToResponse(ScreeningAssessment screening) {
        return ScreeningAssessmentResponseDto.builder()
                .id(screening.getId())
                .motherId(screening.getMother() != null ? screening.getMother().getId() : null)
                .assessmentDate(screening.getAssessmentDate())
                .age(screening.getAge())
                .feelingSadOrTearful(screening.getFeelingSadOrTearful())
                .irritableTowardsBabyPartner(screening.getIrritableTowardsBabyPartner())
                .troubleSleepingAtNight(screening.getTroubleSleepingAtNight())
                .problemsConcentratingOrMakingDecision(screening.getProblemsConcentratingOrMakingDecision())
                .overeatingOrLossOfAppetite(screening.getOvereatingOrLossOfAppetite())
                .feelingAnxious(screening.getFeelingAnxious())
                .feelingOfGuilt(screening.getFeelingOfGuilt())
                .problemsOfBondingWithBaby(screening.getProblemsOfBondingWithBaby())
                .suicideAttempt(screening.getSuicideAttempt())
                .sharedWithDoctor(screening.getSharedWithDoctor())
                .createdAt(screening.getCreatedAt())
                .build();
    }

    private PredictionResultResponseDto mapPredictionToResponse(PredictionResult prediction) {
        return PredictionResultResponseDto.builder()
                .id(prediction.getId())
                .screeningId(prediction.getScreeningAssessment() != null ? prediction.getScreeningAssessment().getId() : null)
                .riskLabel(prediction.getRiskLabel())
                .riskLevel(prediction.getRiskLevel())
                .confidence(prediction.getConfidence())
                .probabilityLow(prediction.getProbabilityLow())
                .probabilityModerate(prediction.getProbabilityModerate())
                .probabilityHigh(prediction.getProbabilityHigh())
                .predictionDate(prediction.getPredictionDate())
                .modelVersion(prediction.getModelVersion())
                .build();
    }
}