package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import tn.esprit.backend.entity.Alert;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.repository.AlertRepository;
import tn.esprit.backend.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final UserRepository userRepository;

    /* private static final Long USER_ID = 1L;
    private static final Long ADMIN_ID = 2L;
    private static final Long PARTNER_ID = 3L; */

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<Alert> getMyAlerts() {
        User currentUser = getAuthenticatedUser();
        return alertRepository
                .findByUserIdOrderByTriggeredAtDesc(
                        currentUser.getId()
                );
    }

    public List<Alert> getUnread() {
        User currentUser = getAuthenticatedUser();
        return alertRepository
                .findByUserIdAndIsRead(
                        currentUser.getId(), false
                );
    }

    public Alert markAsRead(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Alerte non trouvée")
                );
        alert.setIsRead(true);
        return alertRepository.save(alert);
    }

    public Alert dismiss(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Alerte non trouvée")
                );
        alert.setDismissedAt(LocalDateTime.now());
        alert.setIsRead(true);
        return alertRepository.save(alert);
    }

    public void markAllAsRead() {
        List<Alert> unread = getUnread();
        unread.forEach(a -> a.setIsRead(true));
        alertRepository.saveAll(unread);
    }

    public void delete(Long id) {
        alertRepository.deleteById(id);
    }

    // ADMIN
    public List<Alert> getAllAlerts() {
        return alertRepository.findAll();
    }
    public List<Alert> getCriticalAlerts() {
        return alertRepository.findAll().stream()
                .filter(a -> a.getSeverity() ==
                        Alert.AlertSeverity.CRITICAL)
                .toList();
    }
}