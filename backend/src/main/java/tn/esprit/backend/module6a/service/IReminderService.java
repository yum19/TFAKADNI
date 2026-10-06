package tn.esprit.backend.module6a.service;

import tn.esprit.backend.module6a.dto.ReminderRequestDTO;
import tn.esprit.backend.module6a.dto.ReminderResponseDTO;

import java.time.LocalDateTime;
import java.util.List;

public interface IReminderService {

    ReminderResponseDTO createManualReminder(String email, Long babyId, ReminderRequestDTO request);

    void createOrUpdateAutoReminder(Long babyId, String type, LocalDateTime reminderDate, String message, String sourceType, Long sourceId);

    void deleteAutoReminder(Long babyId, String sourceType, Long sourceId);

    List<ReminderResponseDTO> getAllRemindersByBaby(String email, Long babyId);

    ReminderResponseDTO getReminderById(String email, Long babyId, Long reminderId);

    List<ReminderResponseDTO> getPendingReminders(String email, Long babyId);

    List<ReminderResponseDTO> getTodayReminders(String email, Long babyId);

    ReminderResponseDTO updateReminder(String email, Long babyId, Long reminderId, ReminderRequestDTO request);

    ReminderResponseDTO updateReminderStatus(String email, Long babyId, Long reminderId, String status);

    void deleteReminder(String email, Long babyId, Long reminderId);
}