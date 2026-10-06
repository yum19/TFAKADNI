package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.PartnerNotification;
import tn.esprit.backend.repository.PartnerNotificationRepository;
import tn.esprit.backend.service.PartnerNotificationService;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class PartnerNotificationServiceImpl implements PartnerNotificationService {

    private final PartnerNotificationRepository notificationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PartnerNotification> getUserNotifications(Long userId) {
        return notificationRepository.findByRelatedToIdOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Long countUnread(Long userId) {
        return notificationRepository.countByRelatedToIdAndIsReadFalse(userId);
    }

    @Override
    public PartnerNotification markAsRead(Long notificationId, Long currentUserId) {
        PartnerNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getRelatedTo().getId().equals(currentUserId)) {
            throw new AccessDeniedException("You cannot mark another user's notification as read.");
        }

        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }
}
