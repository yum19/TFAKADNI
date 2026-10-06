package tn.esprit.backend.module6a.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.module6a.entity.Baby;

import java.util.List;
import java.util.Optional;

public interface BabyRepository extends JpaRepository<Baby, Long> {

    List<Baby> findByMother(User mother);

    List<Baby> findByMotherId(Long motherId);

    Optional<Baby> findByIdAndMotherId(Long babyId, Long motherId);
}