package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.Referral;
import java.util.List;
import java.util.Optional;

public interface ReferralRepository extends JpaRepository<Referral, Long> {
    List<Referral> findByReferrerId(Long referrerId);
    Optional<Referral> findByReferredId(Long referredId);
    boolean existsByReferredId(Long referredId);
    int countByReferrerIdAndStatus(Long referrerId, Referral.Status status);
}