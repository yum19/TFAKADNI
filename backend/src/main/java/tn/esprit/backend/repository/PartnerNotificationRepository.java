package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.backend.entity.PartnerNotification;
import tn.esprit.backend.enumtype.NotificationType;

import java.util.List;

@Repository
public interface PartnerNotificationRepository extends JpaRepository<PartnerNotification, Long> {

    List<PartnerNotification> findByRelatedToIdOrderByCreatedAtDesc(Long userId);

    Long countByRelatedToIdAndIsReadFalse(Long userId);

    List<PartnerNotification> findByRelatedToIdAndTypeOrderByCreatedAtDesc(Long userId, NotificationType type);

}
