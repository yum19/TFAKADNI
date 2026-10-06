package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.request.VitalsMLRequest;
import tn.esprit.backend.dto.response.MLPredictionResponse;
import tn.esprit.backend.entity.Vitals;
import tn.esprit.backend.service.impl.MLService;
import tn.esprit.backend.service.impl.VitalsService;

import java.util.List;

@RestController
@RequestMapping("/api/vitals")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class VitalsController {

    private final VitalsService vitalsService;
    private final MLService mlService;

    // ===== FRONT OFFICE — FEMME (Role: USER) =====

    @PreAuthorize("hasRole('USER')")
    @PostMapping
    public ResponseEntity<Vitals> save(
            @RequestBody Vitals vitals,
            @RequestParam(required = false) Long pregnancyId) {
        return ResponseEntity.ok(
                vitalsService.save(vitals, pregnancyId)
        );
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/me")
    public ResponseEntity<List<Vitals>> getMyVitals() {
        return ResponseEntity.ok(
                vitalsService.getMyVitals()
        );
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/{id}")
    public ResponseEntity<Vitals> getById(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                vitalsService.getById(id)
        );
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}")
    public ResponseEntity<Vitals> update(
            @PathVariable Long id,
            @RequestBody Vitals vitals) {
        return ResponseEntity.ok(
                vitalsService.update(id, vitals)
        );
    }

    @PreAuthorize("hasRole('USER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {
        vitalsService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ===== ML PREDICTION (Role: USER) =====
    // Assuming the ML prediction tool is used by the mother to check her vitals

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/ml/predict")
    public ResponseEntity<MLPredictionResponse> mlPredict(
            @RequestBody VitalsMLRequest request) {
        return ResponseEntity.ok(mlService.predict(request));
    }

    // ===== BACK OFFICE — ADMIN (Role: ADMIN) =====

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/all")
    public ResponseEntity<List<Vitals>> getAllAdmin() {
        return ResponseEntity.ok(
                vitalsService.getAllVitals()
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/user/{userId}")
    public ResponseEntity<List<Vitals>> getByUserAdmin(
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                vitalsService.getByUserId(userId)
        );
    }
}