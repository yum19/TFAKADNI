package tn.esprit.backend.module6b.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.backend.module6b.entity.SupportResource;

import java.util.List;

public interface SupportResourceRepository extends JpaRepository<SupportResource, Long> {

    List<SupportResource> findByIsActiveTrue();

    List<SupportResource> findByIsActiveTrueAndRiskLevelTargetIn(List<String> riskLevels);

    List<SupportResource> findByIsActiveTrueAndIsRecommendedTrue();

    List<SupportResource> findByIsActiveTrueOrderByIdDesc();
}