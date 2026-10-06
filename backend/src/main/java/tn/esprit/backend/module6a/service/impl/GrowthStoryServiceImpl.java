package tn.esprit.backend.module6a.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.module6a.dto.GrowthStoryResponseDTO;
import tn.esprit.backend.module6a.entity.Baby;
import tn.esprit.backend.module6a.entity.GrowthRecord;
import tn.esprit.backend.module6a.exception.BabyNotFoundException;
import tn.esprit.backend.module6a.repository.BabyRepository;
import tn.esprit.backend.module6a.repository.GrowthRecordRepository;
import tn.esprit.backend.module6a.service.IGrowthStoryService;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GrowthStoryServiceImpl implements IGrowthStoryService {

    private final BabyRepository babyRepository;
    private final GrowthRecordRepository growthRecordRepository;
    private final UserRepository userRepository;

    @Override
    public GrowthStoryResponseDTO getGrowthStory(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        List<GrowthRecord> records = growthRecordRepository.findByBabyIdOrderByRecordDateAsc(babyId);

        if (records.isEmpty()) {
            return GrowthStoryResponseDTO.builder()
                    .babyId(babyId)
                    .level("NO_DATA")
                    .title("No growth data")
                    .story("No growth measurements have been recorded for this baby yet.")
                    .recommendation("Add a first measurement of weight, height, and head circumference to start tracking.")
                    .build();
        }

        GrowthRecord latest = records.get(records.size() - 1);

        if (records.size() == 1) {
            return GrowthStoryResponseDTO.builder()
                    .babyId(babyId)
                    .level("INITIAL")
                    .latestRecordDate(latest.getRecordDate())
                    .latestWeight(latest.getWeight())
                    .latestHeight(latest.getHeight())
                    .latestHeadCircumference(latest.getHeadCircumference())
                    .latestBmi(latest.getBmi())
                    .title("First measurement recorded")
                    .story(buildInitialStory(latest))
                    .recommendation("Add another measurement in the coming weeks to better track progress.")
                    .build();
        }

        GrowthRecord previous = records.get(records.size() - 2);

        Double weightDifference = calculateDifference(latest.getWeight(), previous.getWeight());
        Double heightDifference = calculateDifference(latest.getHeight(), previous.getHeight());
        Double headDifference = calculateDifference(latest.getHeadCircumference(), previous.getHeadCircumference());
        Double bmiDifference = calculateDifference(latest.getBmi(), previous.getBmi());

        String level = determineLevel(latest, weightDifference, heightDifference, headDifference);
        String title = buildTitle(level);
        String story = buildStory(latest, previous, weightDifference, heightDifference, headDifference, level);
        String recommendation = buildRecommendation(level);

        return GrowthStoryResponseDTO.builder()
                .babyId(babyId)
                .level(level)
                .latestRecordDate(latest.getRecordDate())
                .latestWeight(latest.getWeight())
                .latestHeight(latest.getHeight())
                .latestHeadCircumference(latest.getHeadCircumference())
                .latestBmi(latest.getBmi())
                .weightDifference(weightDifference)
                .heightDifference(heightDifference)
                .headCircumferenceDifference(headDifference)
                .bmiDifference(bmiDifference)
                .title(title)
                .story(story)
                .recommendation(recommendation)
                .build();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Baby getOwnedBabyOrThrow(User currentUser, Long babyId) {
        return babyRepository.findByIdAndMotherId(babyId, currentUser.getId())
                .orElseThrow(() -> new BabyNotFoundException("Baby not found or access denied"));
    }

    private String determineLevel(GrowthRecord latest, Double weightDifference, Double heightDifference, Double headDifference) {
        if (latest.getRecordDate() != null && latest.getRecordDate().isBefore(LocalDate.now().minusDays(30))) {
            return "ATTENTION";
        }

        boolean weightPositive = weightDifference != null && weightDifference > 0;
        boolean heightPositive = heightDifference != null && heightDifference > 0;
        boolean headPositive = headDifference == null || headDifference >= 0;

        if (weightPositive && heightPositive && headPositive) {
            return "POSITIVE";
        }

        if ((weightDifference != null && weightDifference < 0)
                || (heightDifference != null && heightDifference < 0)
                || (headDifference != null && headDifference < 0)) {
            return "ATTENTION";
        }

        return "STABLE";
    }

    private String buildTitle(String level) {
        return switch (level) {
            case "POSITIVE" -> "Positive growth";
            case "ATTENTION" -> "Needs attention";
            case "STABLE" -> "Stable growth";
            default -> "Growth tracking";
        };
    }

    private String buildStory(
            GrowthRecord latest,
            GrowthRecord previous,
            Double weightDifference,
            Double heightDifference,
            Double headDifference,
            String level
    ) {
        return "Latest measurement on " + latest.getRecordDate()
                + " compared with the previous one on " + previous.getRecordDate()
                + ". Weight difference: " + weightDifference
                + ", height difference: " + heightDifference
                + ", head circumference difference: " + headDifference
                + ". Status: " + level + ".";
    }

    private String buildRecommendation(String level) {
        return switch (level) {
            case "POSITIVE" -> "Continue regular monitoring.";
            case "ATTENTION" -> "A new measurement or medical advice may be helpful.";
            case "STABLE" -> "Continue tracking to confirm the trend.";
            default -> "Maintain regular growth monitoring.";
        };
    }

    private String buildInitialStory(GrowthRecord latest) {
        return "First measurement recorded on " + latest.getRecordDate()
                + " with weight " + latest.getWeight()
                + ", height " + latest.getHeight()
                + " and head circumference " + latest.getHeadCircumference() + ".";
    }

    private Double calculateDifference(Double current, Double previous) {
        if (current == null || previous == null) {
            return null;
        }
        return current - previous;
    }
}