package tn.esprit.backend.module6a.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.module6a.dto.DiaperLogRequestDTO;
import tn.esprit.backend.module6a.dto.DiaperLogResponseDTO;
import tn.esprit.backend.module6a.entity.Baby;
import tn.esprit.backend.module6a.entity.DiaperLog;
import tn.esprit.backend.module6a.exception.BabyNotFoundException;
import tn.esprit.backend.module6a.exception.InvalidEnumValueException;
import tn.esprit.backend.module6a.exception.Module6aBadRequestException;
import tn.esprit.backend.module6a.exception.Module6aResourceNotFoundException;
import tn.esprit.backend.module6a.repository.BabyRepository;
import tn.esprit.backend.module6a.repository.DiaperLogRepository;
import tn.esprit.backend.module6a.service.IBabyInsightService;
import tn.esprit.backend.module6a.service.IDiaperLogService;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DiaperLogServiceImpl implements IDiaperLogService {

    private final DiaperLogRepository diaperLogRepository;
    private final BabyRepository babyRepository;
    private final UserRepository userRepository;
    private final IBabyInsightService babyInsightService;

    @Override
    public DiaperLogResponseDTO createDiaperLog(String email, Long babyId, DiaperLogRequestDTO request) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);
        validateDiaperLogRequest(request);

        DiaperLog diaperLog = DiaperLog.builder()
                .baby(baby)
                .changeTime(request.getChangeTime())
                .diaperType(normalizeType(request.getDiaperType()))
                .color(normalizeText(request.getColor()))
                .consistency(normalizeText(request.getConsistency()))
                .notes(normalizeText(request.getNotes()))
                .build();

        DiaperLog saved = diaperLogRepository.save(diaperLog);
        babyInsightService.generateInsightsForBaby(email, babyId);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DiaperLogResponseDTO> getAllDiaperLogsByBaby(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return diaperLogRepository.findByBabyIdOrderByChangeTimeDesc(babyId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DiaperLogResponseDTO getDiaperLogById(String email, Long babyId, Long diaperLogId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        DiaperLog diaperLog = diaperLogRepository.findByIdAndBabyId(diaperLogId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Diaper log not found: " + diaperLogId));

        return mapToResponse(diaperLog);
    }

    @Override
    public DiaperLogResponseDTO updateDiaperLog(String email, Long babyId, Long diaperLogId, DiaperLogRequestDTO request) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);
        validateDiaperLogRequest(request);

        DiaperLog diaperLog = diaperLogRepository.findByIdAndBabyId(diaperLogId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Diaper log not found: " + diaperLogId));

        diaperLog.setChangeTime(request.getChangeTime());
        diaperLog.setDiaperType(normalizeType(request.getDiaperType()));
        diaperLog.setColor(normalizeText(request.getColor()));
        diaperLog.setConsistency(normalizeText(request.getConsistency()));
        diaperLog.setNotes(normalizeText(request.getNotes()));

        DiaperLog updated = diaperLogRepository.save(diaperLog);
        babyInsightService.generateInsightsForBaby(email, babyId);
        return mapToResponse(updated);
    }

    @Override
    public void deleteDiaperLog(String email, Long babyId, Long diaperLogId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        DiaperLog diaperLog = diaperLogRepository.findByIdAndBabyId(diaperLogId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Diaper log not found: " + diaperLogId));

        diaperLogRepository.delete(diaperLog);
        babyInsightService.generateInsightsForBaby(email, babyId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DiaperLogResponseDTO> getTodayDiaperLogs(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay().minusNanos(1);

        return diaperLogRepository.findByBabyIdAndChangeTimeBetweenOrderByChangeTimeDesc(babyId, start, end)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Baby getOwnedBabyOrThrow(User currentUser, Long babyId) {
        return babyRepository.findByIdAndMotherId(babyId, currentUser.getId())
                .orElseThrow(() -> new BabyNotFoundException("Baby not found or access denied"));
    }

    private DiaperLogResponseDTO mapToResponse(DiaperLog diaperLog) {
        return DiaperLogResponseDTO.builder()
                .id(diaperLog.getId())
                .babyId(diaperLog.getBaby().getId())
                .changeTime(diaperLog.getChangeTime())
                .diaperType(diaperLog.getDiaperType())
                .color(diaperLog.getColor())
                .consistency(diaperLog.getConsistency())
                .notes(diaperLog.getNotes())
                .createdAt(diaperLog.getCreatedAt())
                .build();
    }

    private void validateDiaperLogRequest(DiaperLogRequestDTO request) {
        if (request.getChangeTime() == null) {
            throw new Module6aBadRequestException("Change time is required");
        }

        if (request.getDiaperType() == null || request.getDiaperType().isBlank()) {
            throw new Module6aBadRequestException("Diaper type is required");
        }

        String diaperType = normalizeType(request.getDiaperType());
        if (!diaperType.equals("WET")
                && !diaperType.equals("DIRTY")
                && !diaperType.equals("MIXED")) {
            throw new InvalidEnumValueException("Invalid diaper type");
        }
    }

    private String normalizeType(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }
}