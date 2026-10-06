package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.Commande;

import java.util.List;
import java.util.Optional;

public interface CommandeRepository extends JpaRepository<Commande, Long> {

    List<Commande> findByUserId(Long userId);

    Optional<Commande> findByIdAndUserId(Long id, Long userId);

    /** Used by the Stripe webhook to look up the order */
    Optional<Commande> findByStripeSessionId(String stripeSessionId);
}