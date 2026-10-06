package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.Panier;

import java.util.List;
import java.util.Optional;

public interface PanierRepository extends JpaRepository<Panier, Long> {
    List<Panier> findByUserId(Long userId);
    Optional<Panier> findByIdAndUserId(Long id, Long userId);
}