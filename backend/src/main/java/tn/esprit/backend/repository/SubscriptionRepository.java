package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.Subscription;

import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findByUserIdAndStatus(Long userId, Subscription.Status status);
    List<Subscription> findByUserId(Long userId);
    boolean existsByUserIdAndStatus(Long userId, Subscription.Status status);

}