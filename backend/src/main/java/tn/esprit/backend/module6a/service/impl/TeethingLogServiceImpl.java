package tn.esprit.backend.module6a.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.module6a.dto.TeethingLogRequestDTO;
import tn.esprit.backend.module6a.dto.TeethingLogResponseDTO;
import tn.esprit.backend.module6a.entity.Baby;
import tn.esprit.backend.module6a.entity.TeethingLog;
import tn.esprit.backend.module6a.exception.BabyNotFoundException;
import tn.esprit.backend.module6a.exception.InvalidDateRangeException;
import tn.esprit.backend.module6a.exception.Module6aBadRequestException;
import tn.esprit.backend.module6a.exception.Module6aResourceNotFoundException;
import tn.esprit.backend.module6a.repository.BabyRepository;
import tn.esprit.backend.module6a.repository.TeethingLogRepository;
import tn.esprit.backend.module6a.service.IBabyInsightService;
import tn.esprit.backend.module6a.service.ITeethingLogService;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TeethingLogServiceImpl implements ITeethingLogService {

    private final TeethingLogRepository teethingLogRepository;
    private final BabyRepository babyRepository;
    private final UserRepository userRepository;
    private final IBabyInsightService babyInsightService;

    @Override
    public TeethingLogResponseDTO createTeethingLog(String email, Long babyId, TeethingLogRequestDTO request) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);
        validateTeethingLogRequest(request, baby);

        TeethingLog teethingLog = TeethingLog.builder()
                .baby(baby)
                .toothLabel(normalizeToothLabel(request.getToothLabel()))
                .eruptionDate(request.getEruptionDate())
                .symptoms(normalizeText(request.getSymptoms()))
                .notes(normalizeText(request.getNotes()))
                .build();

        TeethingLog saved = teethingLogRepository.save(teethingLog);
        babyInsightService.generateInsightsForBaby(email, babyId);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeethingLogResponseDTO> getAllTeethingLogsByBaby(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return teethingLogRepository.findByBabyIdOrderByEruptionDateDescIdDesc(babyId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TeethingLogResponseDTO getTeethingLogById(String email, Long babyId, Long teethingLogId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        TeethingLog teethingLog = teethingLogRepository.findByIdAndBabyId(teethingLogId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Teething log not found: " + teethingLogId));

        return mapToResponse(teethingLog);
    }

    @Override
    public TeethingLogResponseDTO updateTeethingLog(String email, Long babyId, Long teethingLogId, TeethingLogRequestDTO request) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);
        validateTeethingLogRequest(request, babyRepository.findByIdAndMotherId(babyId, currentUser.getId())
                .orElseThrow(() -> new BabyNotFoundException("Baby not found or access denied")));

        TeethingLog teethingLog = teethingLogRepository.findByIdAndBabyId(teethingLogId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Teething log not found: " + teethingLogId));

        teethingLog.setToothLabel(normalizeToothLabel(request.getToothLabel()));
        teethingLog.setEruptionDate(request.getEruptionDate());
        teethingLog.setSymptoms(normalizeText(request.getSymptoms()));
        teethingLog.setNotes(normalizeText(request.getNotes()));

        TeethingLog updated = teethingLogRepository.save(teethingLog);
        babyInsightService.generateInsightsForBaby(email, babyId);
        return mapToResponse(updated);
    }

    @Override
    public void deleteTeethingLog(String email, Long babyId, Long teethingLogId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        TeethingLog teethingLog = teethingLogRepository.findByIdAndBabyId(teethingLogId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Teething log not found: " + teethingLogId));

        teethingLogRepository.delete(teethingLog);
        babyInsightService.generateInsightsForBaby(email, babyId);
    }

    @Override
    @Transactional(readOnly = true)
    public TeethingLogResponseDTO getLatestTeethingLog(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        TeethingLog teethingLog = teethingLogRepository.findFirstByBabyIdOrderByEruptionDateDescIdDesc(babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("No teething log found for baby: " + babyId));

        return mapToResponse(teethingLog);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Baby getOwnedBabyOrThrow(User currentUser, Long babyId) {
        return babyRepository.findByIdAndMotherId(babyId, currentUser.getId())
                .orElseThrow(() -> new BabyNotFoundException("Baby not found or access denied"));
    }

    private TeethingLogResponseDTO mapToResponse(TeethingLog teethingLog) {
        return TeethingLogResponseDTO.builder()
                .id(teethingLog.getId())
                .babyId(teethingLog.getBaby().getId())
                .toothLabel(teethingLog.getToothLabel())
                .eruptionDate(teethingLog.getEruptionDate())
                .symptoms(teethingLog.getSymptoms())
                .notes(teethingLog.getNotes())
                .createdAt(teethingLog.getCreatedAt())
                .build();
    }

    private void validateTeethingLogRequest(TeethingLogRequestDTO request, Baby baby) {
        if (request.getToothLabel() == null || request.getToothLabel().isBlank()) {
            throw new Module6aBadRequestException("Tooth label is required");
        }

        if (request.getEruptionDate() == null) {
            throw new Module6aBadRequestException("Eruption date is required");
        }

        if (request.getEruptionDate().isBefore(baby.getBirthDate())) {
            throw new InvalidDateRangeException("Eruption date cannot be before baby's birth date");
        }

        if (request.getEruptionDate().isAfter(LocalDate.now())) {
            throw new InvalidDateRangeException("Eruption date cannot be in the future");
        }
    }

    private String normalizeToothLabel(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }
}