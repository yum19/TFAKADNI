package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.Notification;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // All unread for a user (not expired)
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.isRead = false AND (n.expiresAt IS NULL OR n.expiresAt > :now) ORDER BY n.createdAt DESC")
    List<Notification> findUnreadByUserId(Long userId, LocalDateTime now);

    // All notifications for a user
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Check if a notification of this type was already created today
    @Query("SELECT COUNT(n) > 0 FROM Notification n WHERE n.user.id = :userId AND n.type = :type AND n.createdAt >= :startOfDay")
    boolean existsTodayByType(Long userId, Notification.NotifType type, LocalDateTime startOfDay);

    // Mark all as read for user
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId")
    void markAllReadByUserId(Long userId);

    // Delete expired
    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.expiresAt IS NOT NULL AND n.expiresAt < :now")
    void deleteExpired(LocalDateTime now);
}