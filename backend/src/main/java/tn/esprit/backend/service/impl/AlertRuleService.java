package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import tn.esprit.backend.entity.AlertRule;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.repository.AlertRuleRepository;
import tn.esprit.backend.repository.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AlertRuleService {

    private final AlertRuleRepository alertRuleRepository;
    private final UserRepository userRepository;

    /* private static final Long USER_ID = 1L;      // Femme
    private static final Long ADMIN_ID = 2L;     // Admin
    private static final Long PARTNER_ID = 3L; */   // Partenaire

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public AlertRule create(AlertRule rule) {
        User currentUser = getAuthenticatedUser();
        rule.setUser(currentUser);
        return alertRuleRepository.save(rule);
    }

    public List<AlertRule> getMyRules() {
        User currentUser = getAuthenticatedUser();
        return alertRuleRepository
                .findByUserId(currentUser.getId());
    }

    public AlertRule update(Long id, AlertRule updated) {
        AlertRule existing = alertRuleRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Règle non trouvée")
                );
        existing.setThreshold(updated.getThreshold());
        existing.setSeverity(updated.getSeverity());
        existing.setNotifMethod(updated.getNotifMethod());
        existing.setLabel(updated.getLabel());
        existing.setActive(updated.getActive());
        return alertRuleRepository.save(existing);
    }

    public AlertRule toggle(Long id) {
        AlertRule rule = alertRuleRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Règle non trouvée")
                );
        rule.setActive(!rule.getActive());
        return alertRuleRepository.save(rule);
    }

    public void delete(Long id) {
        alertRuleRepository.deleteById(id);
    }
    public List<AlertRule> getAllRules() {
        return alertRuleRepository.findAll();
    }
}
