package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.response.ApiResponse;
import tn.esprit.backend.dto.shared.PregnancyContextResponse;
import tn.esprit.backend.entity.Pregnancy;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.service.impl.PregnancyService;

import java.util.List;

@RestController
@RequestMapping("/api/pregnancies")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PregnancyController {

    private final PregnancyService pregnancyService;

    // ===== FRONT OFFICE — FEMME (Role: USER) =====

    @PreAuthorize("hasRole('USER')")
    @PostMapping
    public ResponseEntity<Pregnancy> create(
            @RequestBody Pregnancy pregnancy) {
        return ResponseEntity.ok(
                pregnancyService.create(pregnancy)
        );
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/me")
    public ResponseEntity<List<Pregnancy>> getMyPregnancies() {
        return ResponseEntity.ok(
                pregnancyService.getMyPregnancies()
        );
    }

    // ===== ACTIVE PREGNANCY ENDPOINTS =====

    /**
     * Returns the full Pregnancy entity.
     */
    @PreAuthorize("hasRole('USER')")
    @GetMapping("/me/active")
    public ResponseEntity<Pregnancy> getActive() {
        return ResponseEntity.ok(pregnancyService.getActive());
    }

    /**
     * Returns the specific Context DTO for your existing UI components.
     * Path changed to /me/active/context to prevent conflicts.
     */
    @PreAuthorize("hasRole('USER')")
    @GetMapping("/me/active/context")
    public ResponseEntity<ApiResponse<PregnancyContextResponse>> getMyActivePregnancyContext() {

        // 1. Fetch the actively running pregnancy using the robust service logic
        Pregnancy pregnancy = pregnancyService.getActive();

        if (pregnancy == null) {
            throw new ResourceNotFoundException("Grossesse active introuvable");
        }

        // 2. Map to your existing DTO to ensure your current frontend doesn't break
        PregnancyContextResponse response = PregnancyContextResponse.builder()
                .id(pregnancy.getId())
                .userId(pregnancy.getUser().getId())
                .weekNumber(pregnancyService.getCurrentWeek(pregnancy))
                .dueDate(pregnancy.getDueDate())
                .babyName(null)
                .isSharedPartner(pregnancy.getIsSharedPartner())
                .build();

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/{id}")
    public ResponseEntity<Pregnancy> getById(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                pregnancyService.getById(id)
        );
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}")
    public ResponseEntity<Pregnancy> update(
            @PathVariable Long id,
            @RequestBody Pregnancy pregnancy) {
        return ResponseEntity.ok(
                pregnancyService.update(id, pregnancy)
        );
    }

    @PreAuthorize("hasRole('USER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {
        pregnancyService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ===== PARTNER OFFICE — PARTENAIRE (Role: PARTNER) =====

    @PreAuthorize("hasRole('PARTNER')")
    @GetMapping("/partner/{id}")
    public ResponseEntity<Pregnancy> getForPartner(
            @PathVariable Long id) {
        Pregnancy pregnancy = pregnancyService.getById(id);
        // Vérifie que le partage est activé
        if (!pregnancy.getIsSharedPartner()) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(pregnancy);
    }

    @PreAuthorize("hasRole('PARTNER')")
    @GetMapping("/partner/active")
    public ResponseEntity<Pregnancy> getActiveForPartner() {
        Pregnancy pregnancy = pregnancyService
                .getActiveForPartner();
        if (pregnancy == null ||
                !pregnancy.getIsSharedPartner()) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(pregnancy);
    }

    // ===== BACK OFFICE — ADMIN (Role: ADMIN) =====

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/all")
    public ResponseEntity<List<Pregnancy>> getAllAdmin() {
        return ResponseEntity.ok(
                pregnancyService.getAllForAdmin()
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/{id}/status")
    public ResponseEntity<Pregnancy> updateStatus(
            @PathVariable Long id,
            @RequestParam Pregnancy.PregnancyStatus status) {
        return ResponseEntity.ok(
                pregnancyService.updateStatus(id, status)
        );
    }
}