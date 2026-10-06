package tn.esprit.backend.module6b.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.module6b.dto.StoryAudioResponseDto;
import tn.esprit.backend.module6b.dto.StoryRequestDto;
import tn.esprit.backend.module6b.dto.StoryResponseDto;
import tn.esprit.backend.module6b.entity.ContraceptionLog;
import tn.esprit.backend.module6b.entity.EmotionalStory;
import tn.esprit.backend.module6b.entity.MoodLog;
import tn.esprit.backend.module6b.entity.PredictionResult;
import tn.esprit.backend.module6b.entity.PsychAppointment;
import tn.esprit.backend.module6b.entity.ScreeningAssessment;
import tn.esprit.backend.module6b.exception.PostpartumAccountContextException;
import tn.esprit.backend.module6b.exception.PostpartumOwnershipException;
import tn.esprit.backend.module6b.exception.PostpartumRecordMissingException;
import tn.esprit.backend.module6b.repository.ContraceptionLogRepository;
import tn.esprit.backend.module6b.repository.EmotionalStoryRepository;
import tn.esprit.backend.module6b.repository.MoodLogRepository;
import tn.esprit.backend.module6b.repository.PredictionResultRepository;
import tn.esprit.backend.module6b.repository.PsychAppointmentRepository;
import tn.esprit.backend.module6b.repository.ScreeningAssessmentRepository;
import tn.esprit.backend.module6b.service.IStorytellingService;
import tn.esprit.backend.module6b.service.StoryAudioGeneratorService;
import tn.esprit.backend.repository.UserRepository;

import java.io.File;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StorytellingServiceImpl implements IStorytellingService {

    private final EmotionalStoryRepository emotionalStoryRepository;
    private final MoodLogRepository moodLogRepository;
    private final ScreeningAssessmentRepository screeningAssessmentRepository;
    private final PredictionResultRepository predictionResultRepository;
    private final PsychAppointmentRepository psychAppointmentRepository;
    private final ContraceptionLogRepository contraceptionLogRepository;
    private final UserRepository userRepository;
    private final StoryAudioGeneratorService storyAudioGeneratorService;

    @Override
    public StoryResponseDto generateStory(String email, StoryRequestDto request) {
        User user = getUserByEmail(email);

        String periodType = normalizeOrDefault(request.getPeriodType(), "WEEKLY");
        String tone = normalizeOrDefault(request.getTone(), "SUPPORTIVE");
        String voiceType = normalizeOrDefault(request.getVoiceType(), "SOFT_FEMALE");

        LocalDate today = LocalDate.now();
        LocalDate startDate = "MONTHLY".equals(periodType) ? today.minusDays(30) : today.minusDays(7);

        List<MoodLog> moodLogs = moodLogRepository.findByMotherIdOrderByLogDateDesc(user.getId())
                .stream()
                .filter(log -> !log.getLogDate().isBefore(startDate))
                .toList();

        List<ScreeningAssessment> screenings = screeningAssessmentRepository
                .findByMotherIdOrderByAssessmentDateDesc(user.getId())
                .stream()
                .filter(s -> !s.getAssessmentDate().toLocalDate().isBefore(startDate))
                .toList();

        List<PredictionResult> predictions = predictionResultRepository
                .findByScreeningAssessmentMotherIdOrderByPredictionDateDesc(user.getId())
                .stream()
                .filter(p -> !p.getPredictionDate().toLocalDate().isBefore(startDate))
                .toList();

        List<PsychAppointment> appointments = psychAppointmentRepository
                .findByMotherIdOrderByAppointmentDateDesc(user.getId())
                .stream()
                .filter(a -> !a.getAppointmentDate().toLocalDate().isBefore(startDate))
                .toList();

        List<ContraceptionLog> contraceptionLogs = contraceptionLogRepository
                .findByMotherIdOrderByStartDateDesc(user.getId())
                .stream()
                .filter(c -> !c.getStartDate().isBefore(startDate))
                .toList();

        String title = buildTitle(periodType);
        List<String> highlights = buildHighlights(moodLogs, predictions, appointments, contraceptionLogs);
        String storyText = buildNarrative(periodType, moodLogs, predictions, appointments, contraceptionLogs);

        EmotionalStory story = EmotionalStory.builder()
                .mother(user)
                .periodType(periodType)
                .tone(tone)
                .title(title)
                .storyText(storyText)
                .highlights(String.join(" || ", highlights))
                .audioUrl(null)
                .voiceType(voiceType)
                .audioGenerated(false)
                .createdAt(LocalDateTime.now())
                .build();

        return mapToResponse(emotionalStoryRepository.save(story));
    }

    @Override
    public StoryResponseDto getLatestStory(String email) {
        User user = getUserByEmail(email);

        EmotionalStory story = emotionalStoryRepository.findTopByMotherIdOrderByCreatedAtDesc(user.getId())
                .orElseThrow(() -> new PostpartumRecordMissingException("No emotional story found"));

        return mapToResponse(story);
    }

    @Override
    public List<StoryResponseDto> getStoryHistory(String email) {
        User user = getUserByEmail(email);

        return emotionalStoryRepository.findByMotherIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public StoryResponseDto getStoryById(String email, Long id) {
        User user = getUserByEmail(email);

        EmotionalStory story = emotionalStoryRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("EmotionalStory not found with id: " + id));

        checkOwner(story.getMother().getId(), user.getId());
        return mapToResponse(story);
    }

    @Override
    public void deleteStory(String email, Long id) {
        User user = getUserByEmail(email);

        EmotionalStory story = emotionalStoryRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("EmotionalStory not found with id: " + id));

        checkOwner(story.getMother().getId(), user.getId());

        if (story.getAudioUrl() != null && !story.getAudioUrl().isBlank()) {
            String fileName = extractFileNameFromAudioUrl(story.getAudioUrl());
            if (fileName != null) {
                File audioFile = new File("uploads/storytelling-audio", fileName);
                if (audioFile.exists()) {
                    audioFile.delete();
                }
            }
        }

        emotionalStoryRepository.delete(story);
    }

    @Override
    public StoryAudioResponseDto generateAudioForStory(String email, Long storyId, String voiceType) {
        try {
            User user = getUserByEmail(email);

            EmotionalStory story = emotionalStoryRepository.findById(storyId)
                    .orElseThrow(() -> new PostpartumRecordMissingException("EmotionalStory not found with id: " + storyId));

            checkOwner(story.getMother().getId(), user.getId());

            String selectedVoice = normalizeOrDefault(voiceType, "SOFT_FEMALE");

            String audioUrl = storyAudioGeneratorService.generateAudioFile(
                    story.getId(),
                    story.getStoryText(),
                    selectedVoice
            );

            story.setAudioGenerated(true);
            story.setAudioUrl(audioUrl);
            story.setVoiceType(selectedVoice);

            emotionalStoryRepository.save(story);

            return StoryAudioResponseDto.builder()
                    .storyId(story.getId())
                    .audioGenerated(true)
                    .audioUrl(audioUrl)
                    .voiceType(selectedVoice)
                    .message("Audio storytelling generated successfully")
                    .build();

        } catch (Exception e) {
            System.err.println("=== ERREUR generateAudioForStory ===");
            System.err.println("Message: " + e.getMessage());
            System.err.println("Cause: " + (e.getCause() != null ? e.getCause().getMessage() : "null"));
            e.printStackTrace(System.err);
            throw e;
        }
    }

    private String buildTitle(String periodType) {
        if ("MONTHLY".equalsIgnoreCase(periodType)) {
            return "Your monthly emotional reflection";
        }
        return "Your weekly emotional reflection";
    }

    private List<String> buildHighlights(
            List<MoodLog> moodLogs,
            List<PredictionResult> predictions,
            List<PsychAppointment> appointments,
            List<ContraceptionLog> contraceptionLogs
    ) {
        List<String> highlights = new ArrayList<>();

        if (!moodLogs.isEmpty()) {
            highlights.add("You stayed engaged with your emotional tracking");
        }

        if (!predictions.isEmpty()) {
            highlights.add("A recent screening offered new emotional insight");
        }

        boolean completedAppointments = appointments.stream()
                .anyMatch(a -> "COMPLETED".equalsIgnoreCase(a.getStatus()));

        boolean plannedAppointments = appointments.stream()
                .anyMatch(a -> "PLANNED".equalsIgnoreCase(a.getStatus()));

        if (completedAppointments) {
            highlights.add("You followed through with psychological support");
        } else if (plannedAppointments) {
            highlights.add("Your care journey remained active this week");
        }

        contraceptionLogs.stream()
                .findFirst()
                .ifPresent(log -> highlights.add("You continued reflecting on postpartum contraception"));

        if (highlights.isEmpty()) {
            highlights.add("You began building your postpartum wellness story");
        }

        return highlights;
    }

    private String buildNarrative(
            String periodType,
            List<MoodLog> moodLogs,
            List<PredictionResult> predictions,
            List<PsychAppointment> appointments,
            List<ContraceptionLog> contraceptionLogs
    ) {
        String intro = "MONTHLY".equalsIgnoreCase(periodType)
                ? "This month, take a gentle moment to reflect on your journey. "
                : "This week, take a gentle moment to reflect on your journey. ";

        StringBuilder story = new StringBuilder(intro);

        if (moodLogs.isEmpty()) {
            story.append("You began building your emotional postpartum story, one step at a time. ");
        } else {
            double avgMood = moodLogs.stream()
                    .mapToInt(MoodLog::getMoodScore)
                    .average()
                    .orElse(0.0);

            if (avgMood >= 7) {
                story.append("You showed encouraging emotional balance, with signs of strength, calm, and resilience. ");
            } else if (avgMood >= 4) {
                story.append("You experienced a mix of emotions, moving through moments of fatigue while still showing resilience. ");
            } else {
                story.append("This seemed to be a more delicate emotional period, with signs of exhaustion, emotional weight, or vulnerability. ");
            }

            long anxiousCount = moodLogs.stream()
                    .filter(m -> m.getEmotionType() != null && m.getEmotionType().equalsIgnoreCase("ANXIOUS"))
                    .count();

            long calmCount = moodLogs.stream()
                    .filter(m -> m.getEmotionType() != null && m.getEmotionType().equalsIgnoreCase("CALM"))
                    .count();

            if (anxiousCount > 0) {
                story.append("There were moments where anxiety appeared in your check-ins, reminding us that emotional support still matters. ");
            }

            if (calmCount > 0) {
                story.append("At the same time, there were also signs of calm, showing your ability to find balance even in difficult moments. ");
            }
        }

        if (!predictions.isEmpty()) {
            String riskLevel = predictions.get(0).getRiskLevel();

            if ("HIGH".equalsIgnoreCase(riskLevel)) {
                story.append("Your most recent emotional screening suggested that this may be a period where extra care and support are especially important. ");
            } else if ("MODERATE".equalsIgnoreCase(riskLevel)) {
                story.append("Your most recent emotional screening suggested a moderate level of emotional sensitivity, with room for care, rest, and attention. ");
            } else {
                story.append("Your most recent emotional screening suggested a relatively reassuring emotional state overall. ");
            }
        }

        boolean completedAppointment = appointments.stream()
                .anyMatch(a -> "COMPLETED".equalsIgnoreCase(a.getStatus()));

        boolean plannedAppointment = appointments.stream()
                .anyMatch(a -> "PLANNED".equalsIgnoreCase(a.getStatus()));

        if (completedAppointment) {
            story.append("You also took an important step in your care journey by attending a psychological follow-up appointment. ");
        } else if (plannedAppointment) {
            story.append("You kept your care journey active by planning psychological follow-up and staying connected to support. ");
        }

        contraceptionLogs.stream()
                .findFirst()
                .ifPresent(log -> story.append("Your postpartum journey also included reflection on contraception, especially around the method ")
                        .append(log.getMethod())
                        .append(". "));

        story.append("Remember, every emotion you record, every step you take, and every moment of reflection helps turn your experience into a story of awareness, care, and strength.");

        return story.toString().trim();
    }

    private StoryResponseDto mapToResponse(EmotionalStory story) {
        List<String> highlights = story.getHighlights() == null || story.getHighlights().isBlank()
                ? List.of()
                : Arrays.stream(story.getHighlights().split("\\s*\\|\\|\\s*"))
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());

        return StoryResponseDto.builder()
                .id(story.getId())
                .motherId(story.getMother() != null ? story.getMother().getId() : null)
                .periodType(story.getPeriodType())
                .tone(story.getTone())
                .title(story.getTitle())
                .storyText(story.getStoryText())
                .highlights(highlights)
                .audioGenerated(story.getAudioGenerated())
                .audioUrl(story.getAudioUrl())
                .voiceType(story.getVoiceType())
                .createdAt(story.getCreatedAt())
                .build();
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

    private String normalizeOrDefault(String value, String defaultValue) {
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }
        return value.trim().toUpperCase();
    }

    private String extractFileNameFromAudioUrl(String audioUrl) {
        if (audioUrl == null || audioUrl.isBlank()) {
            return null;
        }

        int lastSlash = audioUrl.lastIndexOf('/');
        if (lastSlash == -1 || lastSlash == audioUrl.length() - 1) {
            return null;
        }

        return audioUrl.substring(lastSlash + 1);
    }
}