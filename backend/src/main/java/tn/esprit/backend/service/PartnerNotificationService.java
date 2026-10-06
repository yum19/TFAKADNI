package tn.esprit.backend.service;

import tn.esprit.backend.entity.PartnerNotification;

import java.util.List;

public interface PartnerNotificationService {
    List<PartnerNotification> getUserNotifications(Long userId);
    Long countUnread(Long userId);
    PartnerNotification markAsRead(Long notificationId, Long currentUserId);
}
