package tn.esprit.backend.module6a.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.module6a.dto.SleepLogRequestDTO;
import tn.esprit.backend.module6a.dto.SleepLogResponseDTO;
import tn.esprit.backend.module6a.entity.Baby;
import tn.esprit.backend.module6a.entity.SleepLog;
import tn.esprit.backend.module6a.exception.BabyNotFoundException;
import tn.esprit.backend.module6a.exception.InvalidDateRangeException;
import tn.esprit.backend.module6a.exception.InvalidEnumValueException;
import tn.esprit.backend.module6a.exception.Module6aBadRequestException;
import tn.esprit.backend.module6a.exception.Module6aResourceNotFoundException;
import tn.esprit.backend.module6a.repository.BabyRepository;
import tn.esprit.backend.module6a.repository.SleepLogRepository;
import tn.esprit.backend.module6a.service.IBabyRhythmService;
import tn.esprit.backend.module6a.service.ISleepLogService;
import tn.esprit.backend.repository.UserRepository;

import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SleepLogServiceImpl implements ISleepLogService {

    private final SleepLogRepository sleepLogRepository;
    private final BabyRepository babyRepository;
    private final UserRepository userRepository;
    private final IBabyRhythmService babyRhythmService;

    @Override
    public SleepLogResponseDTO createSleepLog(String email, Long babyId, SleepLogRequestDTO request) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);
        validateSleepLogRequest(request);

        SleepLog sleepLog = SleepLog.builder()
                .baby(baby)
                .sleepStart(request.getSleepStart())
                .sleepEnd(request.getSleepEnd())
                .quality(normalizeQuality(request.getQuality()))
                .notes(request.getNotes() == null ? null : request.getNotes().trim())
                .build();

        if (request.getSleepStart() != null && request.getSleepEnd() != null) {
            sleepLog.setDuration((int) Duration.between(request.getSleepStart(), request.getSleepEnd()).toMinutes());
        }

        SleepLog savedSleepLog = sleepLogRepository.save(sleepLog);
        babyRhythmService.recalculateRhythmProfileByBabyId(babyId);

        return mapToResponse(savedSleepLog);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SleepLogResponseDTO> getAllSleepLogsByBaby(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return sleepLogRepository.findByBabyIdOrderBySleepStartDesc(babyId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SleepLogResponseDTO getSleepLogById(String email, Long babyId, Long sleepLogId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        SleepLog sleepLog = sleepLogRepository.findByIdAndBabyId(sleepLogId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Sleep log introuvable : " + sleepLogId));

        return mapToResponse(sleepLog);
    }

    @Override
    public SleepLogResponseDTO updateSleepLog(String email, Long babyId, Long sleepLogId, SleepLogRequestDTO request) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);
        validateSleepLogRequest(request);

        SleepLog sleepLog = sleepLogRepository.findByIdAndBabyId(sleepLogId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Sleep log introuvable : " + sleepLogId));

        sleepLog.setSleepStart(request.getSleepStart());
        sleepLog.setSleepEnd(request.getSleepEnd());
        sleepLog.setQuality(normalizeQuality(request.getQuality()));
        sleepLog.setNotes(request.getNotes() == null ? null : request.getNotes().trim());

        if (request.getSleepStart() != null && request.getSleepEnd() != null) {
            sleepLog.setDuration((int) Duration.between(request.getSleepStart(), request.getSleepEnd()).toMinutes());
        } else {
            sleepLog.setDuration(null);
        }

        SleepLog updatedSleepLog = sleepLogRepository.save(sleepLog);
        babyRhythmService.recalculateRhythmProfileByBabyId(babyId);

        return mapToResponse(updatedSleepLog);
    }

    @Override
    public void deleteSleepLog(String email, Long babyId, Long sleepLogId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        SleepLog sleepLog = sleepLogRepository.findByIdAndBabyId(sleepLogId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Sleep log introuvable : " + sleepLogId));

        sleepLogRepository.delete(sleepLog);
        babyRhythmService.recalculateRhythmProfileByBabyId(babyId);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    private Baby getOwnedBabyOrThrow(User currentUser, Long babyId) {
        return babyRepository.findByIdAndMotherId(babyId, currentUser.getId())
                .orElseThrow(() -> new BabyNotFoundException("Bébé introuvable ou accès refusé"));
    }

    private SleepLogResponseDTO mapToResponse(SleepLog sleepLog) {
        return SleepLogResponseDTO.builder()
                .id(sleepLog.getId())
                .babyId(sleepLog.getBaby().getId())
                .sleepStart(sleepLog.getSleepStart())
                .sleepEnd(sleepLog.getSleepEnd())
                .duration(sleepLog.getDuration())
                .quality(sleepLog.getQuality())
                .notes(sleepLog.getNotes())
                .createdAt(sleepLog.getCreatedAt())
                .build();
    }

    private void validateSleepLogRequest(SleepLogRequestDTO request) {
        if (request.getSleepStart() == null) {
            throw new Module6aBadRequestException("Sleep start is required");
        }

        if (request.getSleepEnd() != null && !request.getSleepEnd().isAfter(request.getSleepStart())) {
            throw new InvalidDateRangeException("Sleep end must be after sleep start");
        }

        if (request.getQuality() != null && !request.getQuality().isBlank()) {
            String quality = normalizeQuality(request.getQuality());
            if (!quality.equals("GOOD")
                    && !quality.equals("RESTLESS")
                    && !quality.equals("INTERRUPTED")) {
                throw new InvalidEnumValueException("Invalid sleep quality");
            }
        }
    }

    private String normalizeQuality(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }
}