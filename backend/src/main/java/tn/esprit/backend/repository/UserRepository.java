// ─── UserRepository ───────────────────────────────────────────────────────────
package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByProviderAndProviderId(User.Provider provider, String providerId);
    Optional<User> findByReferralCode(String referralCode);

}