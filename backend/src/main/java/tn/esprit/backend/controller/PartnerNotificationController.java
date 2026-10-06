package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.response.PartnerNotificationResponse;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.mapper.PartnerAndLearningResponseMapper;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.PartnerNotificationService;

import java.util.List;

@RestController
@RequestMapping("/api/partner/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER','PARTNER')")
public class PartnerNotificationController {

    private final PartnerNotificationService partnerNotificationService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<List<PartnerNotificationResponse>> getMyNotifications(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(
                partnerNotificationService.getUserNotifications(userId)
                        .stream()
                        .map(PartnerAndLearningResponseMapper::toNotificationResponse)
                        .toList()
        );
    }

    @GetMapping("/me/unread-count")
    public ResponseEntity<Long> countMyUnread(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(partnerNotificationService.countUnread(userId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<PartnerNotificationResponse> markAsRead(@PathVariable Long id, Authentication authentication) {

        Long currentUserId = getCurrentUserId(authentication);

        return ResponseEntity.ok(
                PartnerAndLearningResponseMapper.toNotificationResponse(partnerNotificationService.markAsRead(id, currentUserId))
        );
    }

    private Long getCurrentUserId(Authentication authentication) {
        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"))
                .getId();
    }

}
