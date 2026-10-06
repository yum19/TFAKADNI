package tn.esprit.backend.module6b.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.module6b.dto.*;
import tn.esprit.backend.module6b.entity.ContraceptionChatMessage;
import tn.esprit.backend.module6b.entity.ContraceptionLog;
import tn.esprit.backend.module6b.entity.ContraceptionProfile;
import tn.esprit.backend.module6b.exception.PostpartumAccountContextException;
import tn.esprit.backend.module6b.exception.PostpartumOwnershipException;
import tn.esprit.backend.module6b.exception.PostpartumRecordMissingException;
import tn.esprit.backend.module6b.repository.ContraceptionChatMessageRepository;
import tn.esprit.backend.module6b.repository.ContraceptionLogRepository;
import tn.esprit.backend.module6b.repository.ContraceptionProfileRepository;
import tn.esprit.backend.module6b.service.ContraceptionAiService;
import tn.esprit.backend.module6b.service.IContraceptionService;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContraceptionServiceImpl implements IContraceptionService {

    private final ContraceptionProfileRepository profileRepository;
    private final ContraceptionLogRepository logRepository;
    private final ContraceptionChatMessageRepository chatRepository;
    private final ContraceptionAiService aiService;
    private final UserRepository userRepository;

    @Override
    public ContraceptionProfileResponseDto recommendMethod(String email, ContraceptionProfileRequestDto dto) {
        User user = getUserByEmail(email);

        ContraceptionProfile profile = ContraceptionProfile.builder()
                .mother(user)
                .age(dto.getAge())
                .isBreastfeeding(dto.getIsBreastfeeding())
                .medicalHistory(dto.getMedicalHistory())
                .preference(dto.getPreference())
                .createdAt(LocalDateTime.now())
                .build();

        String recommendation = aiService.recommendContraceptionMethod(
                profile.getAge(),
                profile.getIsBreastfeeding(),
                profile.getMedicalHistory(),
                profile.getPreference()
        );

        profile.setAiRecommendation(recommendation);
        return mapProfileToResponse(profileRepository.save(profile));
    }

    @Override
    public List<ContraceptionProfileResponseDto> getProfilesByMother(String email) {
        User user = getUserByEmail(email);
        return profileRepository.findByMotherIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapProfileToResponse)
                .toList();
    }

    @Override
    public ContraceptionProfileResponseDto getProfileById(String email, Long id) {
        User user = getUserByEmail(email);
        ContraceptionProfile profile = profileRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("ContraceptionProfile not found with id: " + id));

        checkOwner(profile.getMother().getId(), user.getId());
        return mapProfileToResponse(profile);
    }

    @Override
    public void deleteRecommendation(String email, Long id) {
        User user = getUserByEmail(email);
        ContraceptionProfile profile = profileRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("ContraceptionProfile not found with id: " + id));

        checkOwner(profile.getMother().getId(), user.getId());
        profileRepository.delete(profile);
    }

    @Override
    public ContraceptionChatMessageResponseDto sendChatMessage(String email, ContraceptionChatRequestDto dto) {
        User user = getUserByEmail(email);

        String session = (dto.getSessionId() != null && !dto.getSessionId().isBlank())
                ? dto.getSessionId()
                : UUID.randomUUID().toString();

        ContraceptionChatMessage userMsg = ContraceptionChatMessage.builder()
                .mother(user)
                .role("USER")
                .content(dto.getMessage())
                .sessionId(session)
                .createdAt(LocalDateTime.now())
                .build();
        chatRepository.save(userMsg);

        List<ContraceptionChatMessage> history = chatRepository
                .findByMotherIdAndSessionIdOrderByCreatedAtAsc(user.getId(), session);

        List<Map<String, String>> conversationHistory = history.stream()
                .map(msg -> Map.of(
                        "role", msg.getRole().equals("USER") ? "user" : "assistant",
                        "content", msg.getContent()
                ))
                .collect(Collectors.toList());

        String assistantResponse = aiService.chat(conversationHistory);

        ContraceptionChatMessage assistantMsg = ContraceptionChatMessage.builder()
                .mother(user)
                .role("ASSISTANT")
                .content(assistantResponse)
                .sessionId(session)
                .createdAt(LocalDateTime.now())
                .build();

        return mapChatToResponse(chatRepository.save(assistantMsg));
    }

    @Override
    public List<ContraceptionChatMessageResponseDto> getChatHistory(String email) {
        User user = getUserByEmail(email);
        return chatRepository.findByMotherIdOrderByCreatedAtAsc(user.getId())
                .stream()
                .map(this::mapChatToResponse)
                .toList();
    }

    @Override
    public List<ContraceptionChatMessageResponseDto> getChatSession(String email, String sessionId) {
        User user = getUserByEmail(email);
        return chatRepository.findByMotherIdAndSessionIdOrderByCreatedAtAsc(user.getId(), sessionId)
                .stream()
                .map(this::mapChatToResponse)
                .toList();
    }

    @Override
    public void deleteChatMessage(String email, Long id) {
        User user = getUserByEmail(email);
        ContraceptionChatMessage message = chatRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("ChatMessage not found with id: " + id));

        checkOwner(message.getMother().getId(), user.getId());
        chatRepository.delete(message);
    }

    @Override
    public ContraceptionLogResponseDto createLog(String email, ContraceptionLogRequestDto dto) {
        User user = getUserByEmail(email);

        Optional<ContraceptionLog> activeLog = logRepository.findByMotherIdAndStatus(user.getId(), "ACTIVE");
        if (activeLog.isPresent()) {
            ContraceptionLog current = activeLog.get();
            current.setStatus("CHANGED");
            current.setEndDate(LocalDate.now());
            logRepository.save(current);
        }

        ContraceptionLog log = ContraceptionLog.builder()
                .mother(user)
                .method(dto.getMethod())
                .startDate(dto.getStartDate() != null ? dto.getStartDate() : LocalDate.now())
                .endDate(dto.getEndDate())
                .status("ACTIVE")
                .sideEffects(dto.getSideEffects())
                .notes(dto.getNotes())
                .createdAt(LocalDateTime.now())
                .build();

        return mapLogToResponse(logRepository.save(log));
    }

    @Override
    public ContraceptionLogResponseDto getActiveLog(String email) {
        User user = getUserByEmail(email);
        ContraceptionLog log = logRepository.findByMotherIdAndStatus(user.getId(), "ACTIVE")
                .orElseThrow(() -> new PostpartumRecordMissingException("No active contraception method for mother"));
        return mapLogToResponse(log);
    }

    @Override
    public ContraceptionLogResponseDto stopLog(String email, Long id) {
        User user = getUserByEmail(email);
        ContraceptionLog log = logRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("ContraceptionLog not found with id: " + id));

        checkOwner(log.getMother().getId(), user.getId());
        log.setStatus("STOPPED");
        log.setEndDate(LocalDate.now());
        return mapLogToResponse(logRepository.save(log));
    }

    @Override
    public List<ContraceptionLogResponseDto> getLogsByMother(String email) {
        User user = getUserByEmail(email);
        return logRepository.findByMotherIdOrderByStartDateDesc(user.getId())
                .stream()
                .map(this::mapLogToResponse)
                .toList();
    }

    @Override
    public List<ContraceptionLogResponseDto> getLogsByMotherAndStatus(String email, String status) {
        User user = getUserByEmail(email);
        return logRepository.findByMotherIdAndStatusOrderByStartDateDesc(user.getId(), status)
                .stream()
                .map(this::mapLogToResponse)
                .toList();
    }

    @Override
    public ContraceptionLogResponseDto getLogById(String email, Long id) {
        User user = getUserByEmail(email);
        ContraceptionLog log = logRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("ContraceptionLog not found with id: " + id));

        checkOwner(log.getMother().getId(), user.getId());
        return mapLogToResponse(log);
    }

    @Override
    public ContraceptionLogResponseDto updateLog(String email, Long id, ContraceptionLogRequestDto dto) {
        User user = getUserByEmail(email);
        ContraceptionLog existing = logRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("ContraceptionLog not found with id: " + id));

        checkOwner(existing.getMother().getId(), user.getId());

        existing.setMethod(dto.getMethod());
        existing.setStartDate(dto.getStartDate());
        existing.setEndDate(dto.getEndDate());
        existing.setSideEffects(dto.getSideEffects());
        existing.setNotes(dto.getNotes());

        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            existing.setStatus(dto.getStatus());
        }

        return mapLogToResponse(logRepository.save(existing));
    }

    @Override
    public void deleteLog(String email, Long id) {
        User user = getUserByEmail(email);
        ContraceptionLog log = logRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("ContraceptionLog not found with id: " + id));

        checkOwner(log.getMother().getId(), user.getId());
        logRepository.delete(log);
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

    private ContraceptionProfileResponseDto mapProfileToResponse(ContraceptionProfile profile) {
        return ContraceptionProfileResponseDto.builder()
                .id(profile.getId())
                .motherId(profile.getMother() != null ? profile.getMother().getId() : null)
                .age(profile.getAge())
                .isBreastfeeding(profile.getIsBreastfeeding())
                .medicalHistory(profile.getMedicalHistory())
                .preference(profile.getPreference())
                .aiRecommendation(profile.getAiRecommendation())
                .createdAt(profile.getCreatedAt())
                .build();
    }

    private ContraceptionChatMessageResponseDto mapChatToResponse(ContraceptionChatMessage message) {
        return ContraceptionChatMessageResponseDto.builder()
                .id(message.getId())
                .motherId(message.getMother() != null ? message.getMother().getId() : null)
                .role(message.getRole())
                .content(message.getContent())
                .sessionId(message.getSessionId())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private ContraceptionLogResponseDto mapLogToResponse(ContraceptionLog log) {
        return ContraceptionLogResponseDto.builder()
                .id(log.getId())
                .motherId(log.getMother() != null ? log.getMother().getId() : null)
                .method(log.getMethod())
                .startDate(log.getStartDate())
                .endDate(log.getEndDate())
                .status(log.getStatus())
                .sideEffects(log.getSideEffects())
                .notes(log.getNotes())
                .createdAt(log.getCreatedAt())
                .build();
    }
    @Override
    public ContraceptionChatMessageResponseDto updateChatMessage(String email, Long id, ContraceptionChatRequestDto dto) {
        User user = getUserByEmail(email);

        ContraceptionChatMessage message = chatRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("ChatMessage not found with id: " + id));

        checkOwner(message.getMother().getId(), user.getId());

        if (!"USER".equalsIgnoreCase(message.getRole())) {
            throw new IllegalArgumentException("Only USER messages can be updated");
        }

        message.setContent(dto.getMessage());

        return mapChatToResponse(chatRepository.save(message));
    }
}