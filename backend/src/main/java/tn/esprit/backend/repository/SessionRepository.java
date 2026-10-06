package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import tn.esprit.backend.entity.Session;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SessionRepository extends JpaRepository<Session, Long> {
    Optional<Session> findByTokenHash(String tokenHash);
    List<Session> findByUserId(Long userId);
    List<Session> findByUserIdAndExpiresAtAfter(Long userId, LocalDateTime now);

    @Modifying
    @Query("DELETE FROM Session s WHERE s.expiresAt < :now")
    void deleteExpiredSessions(LocalDateTime now);
}