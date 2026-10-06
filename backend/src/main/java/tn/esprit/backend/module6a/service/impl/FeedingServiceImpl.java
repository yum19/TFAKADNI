package tn.esprit.backend.module6a.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.module6a.dto.FeedingRequestDTO;
import tn.esprit.backend.module6a.dto.FeedingResponseDTO;
import tn.esprit.backend.module6a.entity.Baby;
import tn.esprit.backend.module6a.entity.Feeding;
import tn.esprit.backend.module6a.repository.BabyRepository;
import tn.esprit.backend.module6a.repository.FeedingRepository;
import tn.esprit.backend.module6a.service.IBabyInsightService;
import tn.esprit.backend.module6a.service.IBabyRhythmService;
import tn.esprit.backend.module6a.service.IFeedingService;
import tn.esprit.backend.repository.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FeedingServiceImpl implements IFeedingService {

    private final FeedingRepository feedingRepository;
    private final BabyRepository babyRepository;
    private final UserRepository userRepository;
    private final IBabyInsightService babyInsightService;
    private final IBabyRhythmService babyRhythmService;

    @Override
    public FeedingResponseDTO createFeeding(String email, Long babyId, FeedingRequestDTO request) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);
        validateFeedingRequest(request);

        Feeding feeding = Feeding.builder()
                .baby(baby)
                .feedingDate(request.getFeedingDate())
                .feedingTime(request.getFeedingTime())
                .feedingMode(normalize(request.getFeedingMode()))
                .quantity(request.getQuantity())
                .duration(request.getDuration())
                .sideUsed(normalizeSide(request.getSideUsed()))
                .notes(normalizeText(request.getNotes()))
                .build();

        Feeding savedFeeding = feedingRepository.save(feeding);

        babyInsightService.generateInsightsForBaby(email, babyId);
        babyRhythmService.recalculateRhythmProfileByBabyId(babyId);

        return mapToResponse(savedFeeding);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeedingResponseDTO> getAllFeedingsByBaby(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return feedingRepository.findByBabyIdOrderByFeedingDateDescFeedingTimeDesc(babyId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public FeedingResponseDTO getFeedingById(String email, Long babyId, Long feedingId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        Feeding feeding = feedingRepository.findByIdAndBabyId(feedingId, babyId)
                .orElseThrow(() -> new ResourceNotFoundException("Feeding not found: " + feedingId));

        return mapToResponse(feeding);
    }

    @Override
    public FeedingResponseDTO updateFeeding(String email, Long babyId, Long feedingId, FeedingRequestDTO request) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);
        validateFeedingRequest(request);

        Feeding feeding = feedingRepository.findByIdAndBabyId(feedingId, babyId)
                .orElseThrow(() -> new ResourceNotFoundException("Feeding not found: " + feedingId));

        feeding.setFeedingDate(request.getFeedingDate());
        feeding.setFeedingTime(request.getFeedingTime());
        feeding.setFeedingMode(normalize(request.getFeedingMode()));
        feeding.setQuantity(request.getQuantity());
        feeding.setDuration(request.getDuration());
        feeding.setSideUsed(normalizeSide(request.getSideUsed()));
        feeding.setNotes(normalizeText(request.getNotes()));

        Feeding updatedFeeding = feedingRepository.save(feeding);

        babyInsightService.generateInsightsForBaby(email, babyId);
        babyRhythmService.recalculateRhythmProfileByBabyId(babyId);

        return mapToResponse(updatedFeeding);
    }

    @Override
    public void deleteFeeding(String email, Long babyId, Long feedingId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        Feeding feeding = feedingRepository.findByIdAndBabyId(feedingId, babyId)
                .orElseThrow(() -> new ResourceNotFoundException("Feeding not found: " + feedingId));

        feedingRepository.delete(feeding);

        babyInsightService.generateInsightsForBaby(email, babyId);
        babyRhythmService.recalculateRhythmProfileByBabyId(babyId);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Baby getOwnedBabyOrThrow(User currentUser, Long babyId) {
        return babyRepository.findByIdAndMotherId(babyId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Baby not found or access denied"));
    }

    private FeedingResponseDTO mapToResponse(Feeding feeding) {
        return FeedingResponseDTO.builder()
                .id(feeding.getId())
                .babyId(feeding.getBaby().getId())
                .feedingDate(feeding.getFeedingDate())
                .feedingTime(feeding.getFeedingTime())
                .feedingMode(feeding.getFeedingMode())
                .quantity(feeding.getQuantity())
                .duration(feeding.getDuration())
                .sideUsed(feeding.getSideUsed())
                .notes(feeding.getNotes())
                .createdAt(feeding.getCreatedAt())
                .build();
    }

    private void validateFeedingRequest(FeedingRequestDTO request) {
        if (request.getFeedingDate() == null) {
            throw new IllegalArgumentException("Feeding date is required");
        }

        if (request.getFeedingTime() == null) {
            throw new IllegalArgumentException("Feeding time is required");
        }

        if (request.getFeedingMode() == null || request.getFeedingMode().isBlank()) {
            throw new IllegalArgumentException("Feeding mode is required");
        }

        String mode = normalize(request.getFeedingMode());
        if (!mode.equals("BREASTFEEDING")
                && !mode.equals("BOTTLE")
                && !mode.equals("PUMPED_MILK")
                && !mode.equals("MIXED")) {
            throw new IllegalArgumentException("Invalid feeding mode");
        }

        if (request.getQuantity() != null && request.getQuantity() < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }

        if (request.getDuration() != null && request.getDuration() < 0) {
            throw new IllegalArgumentException("Duration cannot be negative");
        }
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }

    private String normalizeSide(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }
}