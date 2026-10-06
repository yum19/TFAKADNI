package tn.esprit.backend.module6a.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.module6a.dto.BabyMilestoneResponseDTO;
import tn.esprit.backend.module6a.entity.Baby;
import tn.esprit.backend.module6a.entity.BabyMilestone;
import tn.esprit.backend.module6a.exception.BabyNotFoundException;
import tn.esprit.backend.module6a.exception.InvalidDateRangeException;
import tn.esprit.backend.module6a.exception.InvalidEnumValueException;
import tn.esprit.backend.module6a.exception.Module6aBadRequestException;
import tn.esprit.backend.module6a.exception.Module6aResourceNotFoundException;
import tn.esprit.backend.module6a.repository.BabyMilestoneRepository;
import tn.esprit.backend.module6a.repository.BabyRepository;
import tn.esprit.backend.module6a.service.IBabyInsightService;
import tn.esprit.backend.module6a.service.IBabyMilestoneService;
import tn.esprit.backend.repository.UserRepository;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class BabyMilestoneServiceImpl implements IBabyMilestoneService {

    private final BabyMilestoneRepository babyMilestoneRepository;
    private final BabyRepository babyRepository;
    private final UserRepository userRepository;
    private final IBabyInsightService babyInsightService;

    @Value("${app.base-url:http://localhost:8089}")
    private String baseUrl;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public BabyMilestoneResponseDTO createBabyMilestone(
            String email,
            Long babyId,
            String title,
            String category,
            LocalDate milestoneDate,
            String description,
            String mediaType,
            MultipartFile mediaFile
    ) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);

        validateBabyMilestoneRequest(title, category, milestoneDate, baby, mediaType, mediaFile);

        String savedMediaUrl = saveFile(mediaFile);

        BabyMilestone milestone = BabyMilestone.builder()
                .baby(baby)
                .title(normalizeText(title))
                .category(normalizeCategory(category))
                .milestoneDate(milestoneDate)
                .description(normalizeText(description))
                .mediaUrl(savedMediaUrl)
                .mediaType(savedMediaUrl != null ? normalizeMediaType(mediaType) : null)
                .build();

        BabyMilestone saved = babyMilestoneRepository.save(milestone);
        babyInsightService.generateInsightsForBaby(email, babyId);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BabyMilestoneResponseDTO> getAllMilestonesByBaby(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return babyMilestoneRepository.findByBabyIdOrderByMilestoneDateDescIdDesc(babyId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BabyMilestoneResponseDTO getMilestoneById(String email, Long babyId, Long milestoneId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        BabyMilestone milestone = babyMilestoneRepository.findByIdAndBabyId(milestoneId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Milestone not found: " + milestoneId));

        return mapToResponse(milestone);
    }

    @Override
    public BabyMilestoneResponseDTO updateMilestone(
            String email,
            Long babyId,
            Long milestoneId,
            String title,
            String category,
            LocalDate milestoneDate,
            String description,
            String mediaType,
            MultipartFile mediaFile
    ) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);

        BabyMilestone milestone = babyMilestoneRepository.findByIdAndBabyId(milestoneId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Milestone not found: " + milestoneId));

        validateBabyMilestoneRequest(title, category, milestoneDate, baby, mediaType, mediaFile);

        String savedMediaUrl = milestone.getMediaUrl();
        String normalizedMediaType = milestone.getMediaType();

        if (mediaFile != null && !mediaFile.isEmpty()) {
            savedMediaUrl = saveFile(mediaFile);
            normalizedMediaType = normalizeMediaType(mediaType);
        } else if (mediaType == null || mediaType.isBlank()) {
            savedMediaUrl = null;
            normalizedMediaType = null;
        }

        milestone.setTitle(normalizeText(title));
        milestone.setCategory(normalizeCategory(category));
        milestone.setMilestoneDate(milestoneDate);
        milestone.setDescription(normalizeText(description));
        milestone.setMediaUrl(savedMediaUrl);
        milestone.setMediaType(normalizedMediaType);

        BabyMilestone updated = babyMilestoneRepository.save(milestone);
        babyInsightService.generateInsightsForBaby(email, babyId);
        return mapToResponse(updated);
    }

    @Override
    public void deleteMilestone(String email, Long babyId, Long milestoneId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        BabyMilestone milestone = babyMilestoneRepository.findByIdAndBabyId(milestoneId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Milestone not found: " + milestoneId));

        babyMilestoneRepository.delete(milestone);
        babyInsightService.generateInsightsForBaby(email, babyId);
    }

    @Override
    @Transactional(readOnly = true)
    public BabyMilestoneResponseDTO getLatestMilestone(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        BabyMilestone milestone = babyMilestoneRepository.findFirstByBabyIdOrderByMilestoneDateDescIdDesc(babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("No milestone found for baby: " + babyId));

        return mapToResponse(milestone);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BabyMilestoneResponseDTO> getMilestonesByCategory(String email, Long babyId, String category) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return babyMilestoneRepository.findByBabyIdAndCategoryOrderByMilestoneDateDescIdDesc(
                        babyId,
                        normalizeCategory(category)
                )
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private String saveFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            Path uploadPath = Paths.get(uploadDir, "milestones");
            Files.createDirectories(uploadPath);

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String extension = "";

            int dotIndex = originalName.lastIndexOf('.');
            if (dotIndex >= 0) {
                extension = originalName.substring(dotIndex);
            }

            String fileName = UUID.randomUUID() + extension;
            Path filePath = uploadPath.resolve(fileName);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return baseUrl + "/uploads/milestones/" + fileName;
        } catch (IOException e) {
            throw new Module6aBadRequestException("Failed to upload media file");
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Baby getOwnedBabyOrThrow(User currentUser, Long babyId) {
        return babyRepository.findByIdAndMotherId(babyId, currentUser.getId())
                .orElseThrow(() -> new BabyNotFoundException("Baby not found or access denied"));
    }

    private BabyMilestoneResponseDTO mapToResponse(BabyMilestone milestone) {
        return BabyMilestoneResponseDTO.builder()
                .id(milestone.getId())
                .babyId(milestone.getBaby().getId())
                .title(milestone.getTitle())
                .category(milestone.getCategory())
                .milestoneDate(milestone.getMilestoneDate())
                .description(milestone.getDescription())
                .mediaUrl(milestone.getMediaUrl())
                .mediaType(milestone.getMediaType())
                .createdAt(milestone.getCreatedAt())
                .recent(isRecentMilestone(milestone.getMilestoneDate()))
                .build();
    }

    private boolean isRecentMilestone(LocalDate milestoneDate) {
        return milestoneDate != null
                && ChronoUnit.DAYS.between(milestoneDate, LocalDate.now()) <= 7;
    }

    private void validateBabyMilestoneRequest(
            String title,
            String category,
            LocalDate milestoneDate,
            Baby baby,
            String mediaType,
            MultipartFile mediaFile
    ) {
        if (title == null || title.isBlank()) {
            throw new Module6aBadRequestException("Title is required");
        }

        if (category == null || category.isBlank()) {
            throw new Module6aBadRequestException("Category is required");
        }

        String normalizedCategory = normalizeCategory(category);
        if (!normalizedCategory.equals("MOTOR")
                && !normalizedCategory.equals("SOCIAL")
                && !normalizedCategory.equals("LANGUAGE")
                && !normalizedCategory.equals("COGNITIVE")
                && !normalizedCategory.equals("OTHER")) {
            throw new InvalidEnumValueException("Invalid category");
        }

        if (milestoneDate == null) {
            throw new Module6aBadRequestException("Milestone date is required");
        }

        if (milestoneDate.isBefore(baby.getBirthDate())) {
            throw new InvalidDateRangeException("Milestone date cannot be before baby's birth date");
        }

        if (milestoneDate.isAfter(LocalDate.now())) {
            throw new InvalidDateRangeException("Milestone date cannot be in the future");
        }

        if (mediaFile != null && !mediaFile.isEmpty()) {
            if (mediaType == null || mediaType.isBlank()) {
                throw new Module6aBadRequestException("Media type is required when file is provided");
            }

            String normalizedMediaType = normalizeMediaType(mediaType);
            if (!normalizedMediaType.equals("PHOTO")
                    && !normalizedMediaType.equals("VIDEO")
                    && !normalizedMediaType.equals("AUDIO")) {
                throw new InvalidEnumValueException("Invalid media type");
            }
        }
    }

    private String normalizeCategory(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }

    private String normalizeMediaType(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }
}