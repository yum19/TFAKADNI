package tn.esprit.backend.module6b.repository;

import tn.esprit.backend.module6b.entity.ContraceptionProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContraceptionProfileRepository
        extends JpaRepository<ContraceptionProfile, Long> {

    List<ContraceptionProfile> findByMotherIdOrderByCreatedAtDesc(Long motherId);
}