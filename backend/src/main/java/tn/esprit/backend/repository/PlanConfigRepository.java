package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.entity.PlanConfig;

public interface PlanConfigRepository extends JpaRepository<PlanConfig, String> {
}