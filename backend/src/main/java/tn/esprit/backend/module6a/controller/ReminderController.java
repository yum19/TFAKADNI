package tn.esprit.backend.module6a.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6a.dto.ReminderRequestDTO;
import tn.esprit.backend.module6a.dto.ReminderResponseDTO;
import tn.esprit.backend.module6a.service.IReminderService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/babies/{babyId}/reminders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class ReminderController {

    private final IReminderService reminderService;

    @PostMapping
    public ResponseEntity<ReminderResponseDTO> createManualReminder(
            Authentication authentication,
            @PathVariable Long babyId,
            @Valid @RequestBody ReminderRequestDTO request
    ) {
        String email = authentication.getName();
        ReminderResponseDTO response = reminderService.createManualReminder(email, babyId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ReminderResponseDTO>> getAllRemindersByBaby(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(reminderService.getAllRemindersByBaby(email, babyId));
    }

    @GetMapping("/{reminderId}")
    public ResponseEntity<ReminderResponseDTO> getReminderById(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long reminderId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(reminderService.getReminderById(email, babyId, reminderId));
    }

    @PutMapping("/{reminderId}")
    public ResponseEntity<ReminderResponseDTO> updateReminder(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long reminderId,
            @Valid @RequestBody ReminderRequestDTO request
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(reminderService.updateReminder(email, babyId, reminderId, request));
    }

    @PatchMapping("/{reminderId}/status")
    public ResponseEntity<ReminderResponseDTO> updateReminderStatus(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long reminderId,
            @RequestBody Map<String, String> body
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(
                reminderService.updateReminderStatus(email, babyId, reminderId, body.get("status"))
        );
    }

    @DeleteMapping("/{reminderId}")
    public ResponseEntity<String> deleteReminder(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long reminderId
    ) {
        String email = authentication.getName();
        reminderService.deleteReminder(email, babyId, reminderId);
        return ResponseEntity.ok("Reminder deleted successfully");
    }

    @GetMapping("/pending")
    public ResponseEntity<List<ReminderResponseDTO>> getPendingReminders(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(reminderService.getPendingReminders(email, babyId));
    }

    @GetMapping("/today")
    public ResponseEntity<List<ReminderResponseDTO>> getTodayReminders(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(reminderService.getTodayReminders(email, babyId));
    }
}