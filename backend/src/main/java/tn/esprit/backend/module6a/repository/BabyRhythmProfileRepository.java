package tn.esprit.backend.module6a.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6a.entity.BabyRhythmProfile;

import java.util.Optional;

public interface BabyRhythmProfileRepository extends JpaRepository<BabyRhythmProfile, Long> {

    Optional<BabyRhythmProfile> findByBabyId(Long babyId);
}