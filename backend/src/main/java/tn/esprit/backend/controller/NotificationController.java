package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.entity.Notification;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.impl.NotificationService;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    // Helper method to dynamically extract the logged-in user
    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /** GET all unread — called by frontend on app load */
    // @PreAuthorize("hasRole('USER')")
    @GetMapping("/me/unread")
    public ResponseEntity<List<Notification>> getUnread() {
        User currentUser = getAuthenticatedUser(); // ← use this instead

        notificationService.checkAndCreateVitalsReminder(currentUser);
        notificationService.checkAndCreateExamsDueNotification(currentUser);
        notificationService.checkAndCreateAlertTriggeredNotification(currentUser);

        List<Notification> unread = notificationService.getUnread(currentUser.getId());
        return ResponseEntity.ok(unread);
    }

    /** GET all notifications */
    @PreAuthorize("hasRole('USER')")
    @GetMapping("/me")
    public ResponseEntity<List<Notification>> getAll() {
        User currentUser = getAuthenticatedUser();
        return ResponseEntity.ok(notificationService.getAll(currentUser.getId()));
    }

    /** PUT mark one as read */
    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.noContent().build();
    }

    /** PUT mark all as read */
    @PreAuthorize("hasRole('USER')")
    @PutMapping("/me/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        User currentUser = getAuthenticatedUser();
        notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    /** DELETE all for user */
    @PreAuthorize("hasRole('USER')")
    @DeleteMapping("/me/all")
    public ResponseEntity<Void> deleteAll() {
        User currentUser = getAuthenticatedUser();
        // Now accurately deletes all notifications specifically tied to the logged-in user
        notificationService.getAll(currentUser.getId())
                .forEach(n -> notificationService.delete(n.getId()));
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/me/debug")
    public ResponseEntity<String> debug() {
        User currentUser = getAuthenticatedUser();
        Long userId = currentUser.getId();

        // Force run all checks
        notificationService.checkAndCreateVitalsReminder(currentUser);
        notificationService.checkAndCreateExamsDueNotification(currentUser);
        notificationService.checkAndCreateAlertTriggeredNotification(currentUser);

        // Report what's in DB after
        List<Notification> all = notificationService.getAll(userId);

        return ResponseEntity.ok(
                "UserID: " + userId +
                        " | Role: " + currentUser.getRole() +
                        " | IsActive: " + currentUser.getIsActive() +
                        " | Notifications in DB after checks: " + all.size()
        );
    }
    /** DELETE one */
    @PreAuthorize("hasRole('USER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        notificationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}