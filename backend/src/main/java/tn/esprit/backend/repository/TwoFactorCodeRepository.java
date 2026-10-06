package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.TwoFactorCode;

import java.util.Optional;

public interface TwoFactorCodeRepository extends JpaRepository<TwoFactorCode, Long> {
    Optional<TwoFactorCode> findTopByEmailAndUsedFalseOrderByIdDesc(String email);

    @Modifying
    @Transactional
    @Query("DELETE FROM TwoFactorCode t WHERE t.email = :email")
    void deleteAllByEmail(String email);
}