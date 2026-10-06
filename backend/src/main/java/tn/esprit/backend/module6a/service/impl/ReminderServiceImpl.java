package tn.esprit.backend.module6a.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.module6a.dto.ReminderRequestDTO;
import tn.esprit.backend.module6a.dto.ReminderResponseDTO;
import tn.esprit.backend.module6a.entity.Baby;
import tn.esprit.backend.module6a.entity.Reminder;
import tn.esprit.backend.module6a.exception.BabyNotFoundException;
import tn.esprit.backend.module6a.exception.InvalidDateRangeException;
import tn.esprit.backend.module6a.exception.InvalidEnumValueException;
import tn.esprit.backend.module6a.exception.Module6aBadRequestException;
import tn.esprit.backend.module6a.exception.Module6aResourceNotFoundException;
import tn.esprit.backend.module6a.repository.BabyRepository;
import tn.esprit.backend.module6a.repository.ReminderRepository;
import tn.esprit.backend.module6a.service.IReminderService;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReminderServiceImpl implements IReminderService {

    private final ReminderRepository reminderRepository;
    private final BabyRepository babyRepository;
    private final UserRepository userRepository;

    @Override
    public ReminderResponseDTO createManualReminder(String email, Long babyId, ReminderRequestDTO request) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);
        validateManualReminderRequest(request, baby);

        Reminder reminder = Reminder.builder()
                .baby(baby)
                .type(normalizeType(request.getType()))
                .reminderDate(request.getReminderDate())
                .message(normalizeText(request.getMessage()))
                .status(normalizeStatus(request.getStatus()))
                .sourceType("MANUAL")
                .sourceId(null)
                .build();

        Reminder savedReminder = reminderRepository.save(reminder);
        return mapToResponse(savedReminder);
    }

    @Override
    public void createOrUpdateAutoReminder(
            Long babyId,
            String type,
            LocalDateTime reminderDate,
            String message,
            String sourceType,
            Long sourceId
    ) {
        if (reminderDate == null || sourceId == null) {
            return;
        }

        Baby baby = babyRepository.findById(babyId)
                .orElseThrow(() -> new BabyNotFoundException("Baby introuvable : " + babyId));

        Reminder reminder = reminderRepository.findByBabyIdAndSourceTypeAndSourceId(
                        babyId,
                        normalizeSourceType(sourceType),
                        sourceId
                )
                .orElse(
                        Reminder.builder()
                                .baby(baby)
                                .sourceType(normalizeSourceType(sourceType))
                                .sourceId(sourceId)
                                .build()
                );

        reminder.setType(normalizeType(type));
        reminder.setReminderDate(reminderDate);
        reminder.setMessage(normalizeText(message));
        reminder.setStatus("PENDING");

        reminderRepository.save(reminder);
    }

    @Override
    public void deleteAutoReminder(Long babyId, String sourceType, Long sourceId) {
        if (sourceId == null) {
            return;
        }

        reminderRepository.deleteByBabyIdAndSourceTypeAndSourceId(
                babyId,
                normalizeSourceType(sourceType),
                sourceId
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReminderResponseDTO> getAllRemindersByBaby(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return reminderRepository.findByBabyIdOrderByReminderDateDescIdDesc(babyId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReminderResponseDTO getReminderById(String email, Long babyId, Long reminderId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        Reminder reminder = reminderRepository.findByIdAndBabyId(reminderId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Reminder introuvable : " + reminderId));

        return mapToResponse(reminder);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReminderResponseDTO> getPendingReminders(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        return reminderRepository.findByBabyIdAndStatusOrderByReminderDateAscIdAsc(babyId, "PENDING")
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReminderResponseDTO> getTodayReminders(String email, Long babyId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay().minusNanos(1);

        return reminderRepository.findByBabyIdAndReminderDateBetweenOrderByReminderDateAscIdAsc(babyId, start, end)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public ReminderResponseDTO updateReminder(String email, Long babyId, Long reminderId, ReminderRequestDTO request) {
        User currentUser = getUserByEmail(email);
        Baby baby = getOwnedBabyOrThrow(currentUser, babyId);
        validateManualReminderRequest(request, baby);

        Reminder reminder = reminderRepository.findByIdAndBabyId(reminderId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Reminder introuvable : " + reminderId));

        reminder.setType(normalizeType(request.getType()));
        reminder.setReminderDate(request.getReminderDate());
        reminder.setMessage(normalizeText(request.getMessage()));
        reminder.setStatus(normalizeStatus(request.getStatus()));

        return mapToResponse(reminderRepository.save(reminder));
    }

    @Override
    public ReminderResponseDTO updateReminderStatus(String email, Long babyId, Long reminderId, String status) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        Reminder reminder = reminderRepository.findByIdAndBabyId(reminderId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Reminder introuvable : " + reminderId));

        if (status == null || status.isBlank()) {
            throw new Module6aBadRequestException("Reminder status is required");
        }

        String normalizedStatus = normalizeStatus(status);
        if (!normalizedStatus.equals("PENDING")
                && !normalizedStatus.equals("SENT")
                && !normalizedStatus.equals("DISMISSED")) {
            throw new InvalidEnumValueException("Invalid reminder status");
        }

        reminder.setStatus(normalizedStatus);
        return mapToResponse(reminderRepository.save(reminder));
    }

    @Override
    public void deleteReminder(String email, Long babyId, Long reminderId) {
        User currentUser = getUserByEmail(email);
        getOwnedBabyOrThrow(currentUser, babyId);

        Reminder reminder = reminderRepository.findByIdAndBabyId(reminderId, babyId)
                .orElseThrow(() -> new Module6aResourceNotFoundException("Reminder introuvable : " + reminderId));

        reminderRepository.delete(reminder);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    private Baby getOwnedBabyOrThrow(User currentUser, Long babyId) {
        return babyRepository.findByIdAndMotherId(babyId, currentUser.getId())
                .orElseThrow(() -> new BabyNotFoundException("Bébé introuvable ou accès refusé"));
    }

    private ReminderResponseDTO mapToResponse(Reminder reminder) {
        return ReminderResponseDTO.builder()
                .id(reminder.getId())
                .babyId(reminder.getBaby().getId())
                .type(reminder.getType())
                .reminderDate(reminder.getReminderDate())
                .message(reminder.getMessage())
                .status(reminder.getStatus())
                .sourceType(reminder.getSourceType())
                .sourceId(reminder.getSourceId())
                .createdAt(reminder.getCreatedAt())
                .overdue(reminder.getReminderDate() != null
                        && reminder.getReminderDate().isBefore(LocalDateTime.now())
                        && "PENDING".equals(reminder.getStatus()))
                .build();
    }

    private void validateManualReminderRequest(ReminderRequestDTO request, Baby baby) {
        if (request.getType() == null || request.getType().isBlank()) {
            throw new Module6aBadRequestException("Reminder type is required");
        }

        String type = normalizeType(request.getType());
        if (!type.equals("VACCINE")
                && !type.equals("APPOINTMENT")
                && !type.equals("GROWTH")
                && !type.equals("CUSTOM")) {
            throw new InvalidEnumValueException("Invalid reminder type");
        }

        if (request.getReminderDate() == null) {
            throw new Module6aBadRequestException("Reminder date is required");
        }

        if (request.getReminderDate().toLocalDate().isBefore(baby.getBirthDate())) {
            throw new InvalidDateRangeException("Reminder date cannot be before baby's birth date");
        }

        if (request.getMessage() == null || request.getMessage().isBlank()) {
            throw new Module6aBadRequestException("Reminder message is required");
        }

        if (request.getStatus() == null || request.getStatus().isBlank()) {
            throw new Module6aBadRequestException("Reminder status is required");
        }

        String status = normalizeStatus(request.getStatus());
        if (!status.equals("PENDING")
                && !status.equals("SENT")
                && !status.equals("DISMISSED")) {
            throw new InvalidEnumValueException("Invalid reminder status");
        }
    }

    private String normalizeType(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }

    private String normalizeStatus(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }

    private String normalizeSourceType(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }
}