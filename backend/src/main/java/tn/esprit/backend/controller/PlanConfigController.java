package tn.esprit.backend.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.request.PlanConfigRequest;
import tn.esprit.backend.dto.response.ApiResponse;
import tn.esprit.backend.dto.response.PlanConfigResponse;
import tn.esprit.backend.entity.PlanConfig;
import tn.esprit.backend.repository.PlanConfigRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/plans")
@PreAuthorize("hasAnyRole('USER','ADMIN')")
@RequiredArgsConstructor
public class PlanConfigController {

    private final PlanConfigRepository planConfigRepository;
    private final ObjectMapper objectMapper;

    // Initialiser les plans par défaut si la table est vide
    @PostConstruct
    public void initDefaultPlans() {
        if (planConfigRepository.count() == 0) {
            planConfigRepository.saveAll(List.of(
                    PlanConfig.builder()
                            .planKey("FREE")
                            .label("Free")
                            .price("0 TND")
                            .icon("spa")
                            .featuresJson("[\"Profil santé de base\",\"Accès limité au contenu\",\"Support communauté\"]")
                            .build(),
                    PlanConfig.builder()
                            .planKey("PREMIUM")
                            .label("Premium")
                            .price("29 TND/mois")
                            .icon("star")
                            .featuresJson("[\"Profil santé complet\",\"Suivi illimité\",\"Recommandations IA\",\"Support prioritaire\"]")
                            .build(),
                    PlanConfig.builder()
                            .planKey("PRO")
                            .label("Pro")
                            .price("59 TND/mois")
                            .icon("workspace_premium")
                            .featuresJson("[\"Tout Premium inclus\",\"API access\",\"Rapports avancés\",\"Account manager dédié\"]")
                            .build()
            ));
        }
    }

    /**
     * GET /api/plans — Public, accessible par tous
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PlanConfigResponse>>> getAll() {
        List<PlanConfigResponse> plans = planConfigRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(plans));
    }

    /**
     * PUT /api/plans/{planKey} — ADMIN uniquement
     */
    @PutMapping("/{planKey}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PlanConfigResponse>> update(
            @PathVariable String planKey,
            @Valid @RequestBody PlanConfigRequest request
    ) {
        PlanConfig plan = planConfigRepository.findById(planKey)
                .orElseThrow(() -> new RuntimeException("Plan introuvable : " + planKey));

        plan.setLabel(request.getLabel());
        plan.setPrice(request.getPrice());
        plan.setIcon(request.getIcon());

        try {
            plan.setFeaturesJson(objectMapper.writeValueAsString(request.getFeatures()));
        } catch (Exception e) {
            plan.setFeaturesJson("[]");
        }

        planConfigRepository.save(plan);
        return ResponseEntity.ok(ApiResponse.ok("Plan mis à jour.", toResponse(plan)));
    }

    private PlanConfigResponse toResponse(PlanConfig p) {
        List<String> features;
        try {
            features = objectMapper.readValue(p.getFeaturesJson(), new TypeReference<>() {});
        } catch (Exception e) {
            features = List.of();
        }
        return PlanConfigResponse.builder()
                .planKey(p.getPlanKey())
                .label(p.getLabel())
                .price(p.getPrice())
                .icon(p.getIcon())
                .features(features)
                .build();
    }
}