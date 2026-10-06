package tn.esprit.backend.module6a.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.module6a.dto.GrowthRecordRequestDTO;
import tn.esprit.backend.module6a.dto.GrowthRecordResponseDTO;
import tn.esprit.backend.module6a.entity.Baby;
import tn.esprit.backend.module6a.entity.GrowthRecord;
import tn.esprit.backend.module6a.exception.BabyNotFoundException;
import tn.esprit.backend.module6a.exception.InvalidDateRangeException;
import tn.esprit.backend.module6a.exception.Module6aBadRequestException;
import tn.esprit.backend.module6a.exception.Module6aResourceNotFoundException;
import tn.esprit.backend.module6a.repository.BabyRepository;
import tn.esprit.backend.module6a.repository.GrowthRecordRepository;
import tn.esprit.backend.module6a.service.IGrowthRecordService;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class GrowthRecordServiceImpl implements IGrowthRecordService {

    private final GrowthRecordRepository growthRecordRepository;
    private final BabyRepository babyRepository;
    private final UserRepository userRepository;

    @Override
    public GrowthRecordResponseDTO createGrowthRecord(String email, Long babyId, GrowthRecordRequestDTO request) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);
        validateGrowthRecordRequest(request, baby);

        GrowthRecord growthRecord = GrowthRecord.builder()
                .baby(baby)
                .recordDate(request.getRecordDate())
                .weight(request.getWeight())
                .height(request.getHeight())
                .headCircumference(request.getHeadCircumference())
                .notes(request.getNotes() == null ? null : request.getNotes().trim())
                .build();

        growthRecord.calculateBmi();
        return mapToResponse(growthRecordRepository.save(growthRecord));
    }

    @Override
    @Transactional(readOnly = true)
    public List<GrowthRecordResponseDTO> getAllGrowthRecordsByBaby(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return growthRecordRepository.findByBabyIdOrderByRecordDateDescIdDesc(babyId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public GrowthRecordResponseDTO getGrowthRecordById(String email, Long babyId, Long recordId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        GrowthRecord growthRecord = growthRecordRepository.findByIdAndBabyId(recordId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Growth record introuvable : " + recordId));

        return mapToResponse(growthRecord);
    }

    @Override
    public GrowthRecordResponseDTO updateGrowthRecord(String email, Long babyId, Long recordId, GrowthRecordRequestDTO request) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);
        validateGrowthRecordRequest(request, baby);

        GrowthRecord growthRecord = growthRecordRepository.findByIdAndBabyId(recordId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Growth record introuvable : " + recordId));

        growthRecord.setRecordDate(request.getRecordDate());
        growthRecord.setWeight(request.getWeight());
        growthRecord.setHeight(request.getHeight());
        growthRecord.setHeadCircumference(request.getHeadCircumference());
        growthRecord.setNotes(request.getNotes() == null ? null : request.getNotes().trim());
        growthRecord.calculateBmi();

        return mapToResponse(growthRecordRepository.save(growthRecord));
    }

    @Override
    public void deleteGrowthRecord(String email, Long babyId, Long recordId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        GrowthRecord growthRecord = growthRecordRepository.findByIdAndBabyId(recordId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Growth record introuvable : " + recordId));

        growthRecordRepository.delete(growthRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public GrowthRecordResponseDTO getLatestGrowthRecord(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        GrowthRecord growthRecord = growthRecordRepository.findFirstByBabyIdOrderByRecordDateDescIdDesc(babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Aucun growth record trouvé pour le bébé : " + babyId));

        return mapToResponse(growthRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GrowthRecordResponseDTO> getGrowthChart(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return growthRecordRepository.findByBabyIdOrderByRecordDateAsc(babyId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getGrowthAnalysis(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        List<GrowthRecord> records = growthRecordRepository.findByBabyIdOrderByRecordDateAsc(babyId);

        Map<String, Object> analysis = new HashMap<>();
        analysis.put("count", records.size());
        analysis.put("records", records.stream().map(this::mapToResponse).toList());

        return analysis;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    private Baby getOwnedBabyOrThrow(User currentUser, Long babyId) {
        return babyRepository.findByIdAndMotherId(babyId, currentUser.getId())
                .orElseThrow(() -> new BabyNotFoundException("Bébé introuvable ou accès refusé"));
    }

    private GrowthRecordResponseDTO mapToResponse(GrowthRecord growthRecord) {
        return GrowthRecordResponseDTO.builder()
                .id(growthRecord.getId())
                .babyId(growthRecord.getBaby().getId())
                .recordDate(growthRecord.getRecordDate())
                .weight(growthRecord.getWeight())
                .height(growthRecord.getHeight())
                .headCircumference(growthRecord.getHeadCircumference())
                .bmi(growthRecord.getBmi())
                .notes(growthRecord.getNotes())
                .createdAt(growthRecord.getCreatedAt())
                .build();
    }

    private void validateGrowthRecordRequest(GrowthRecordRequestDTO request, Baby baby) {
        if (request.getRecordDate() == null) {
            throw new Module6aBadRequestException("Record date is required");
        }

        if (request.getRecordDate().isBefore(baby.getBirthDate())) {
            throw new InvalidDateRangeException("Record date cannot be before baby's birth date");
        }

        if (request.getRecordDate().isAfter(LocalDate.now())) {
            throw new InvalidDateRangeException("Record date cannot be in the future");
        }

        if (request.getWeight() == null || request.getWeight() <= 0) {
            throw new Module6aBadRequestException("Weight must be greater than 0");
        }

        if (request.getHeight() == null || request.getHeight() <= 0) {
            throw new Module6aBadRequestException("Height must be greater than 0");
        }

        if (request.getHeadCircumference() != null && request.getHeadCircumference() <= 0) {
            throw new Module6aBadRequestException("Head circumference must be greater than 0");
        }
    }
}