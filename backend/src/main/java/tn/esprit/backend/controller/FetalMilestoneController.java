package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.entity.FetalMilestone;
import tn.esprit.backend.service.impl.FetalMilestoneService;

import java.util.List;

@RestController
@RequestMapping("/api/fetal")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class FetalMilestoneController {

    private final FetalMilestoneService fetalMilestoneService;

    // ===== FRONT OFFICE — FEMME (Role: USER) =====

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/week/{weekNumber}")
    public ResponseEntity<FetalMilestone> getByWeek(
            @PathVariable Integer weekNumber) {
        return ResponseEntity.ok(
                fetalMilestoneService.getByWeek(weekNumber)
        );
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/trimester/{trimester}")
    public ResponseEntity<List<FetalMilestone>> getByTrimester(
            @PathVariable FetalMilestone.Trimester trimester) {
        return ResponseEntity.ok(
                fetalMilestoneService.getByTrimester(trimester)
        );
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/all")
    public ResponseEntity<List<FetalMilestone>> getAll() {
        return ResponseEntity.ok(
                fetalMilestoneService.getAll()
        );
    }

    // ===== PARTNER OFFICE — PARTENAIRE (Role: PARTNER) =====

    @PreAuthorize("hasRole('PARTNER')")
    @GetMapping("/partner/week/{weekNumber}")
    public ResponseEntity<FetalMilestone> getByWeekForPartner(
            @PathVariable Integer weekNumber) {
        return ResponseEntity.ok(
                fetalMilestoneService.getByWeek(weekNumber)
        );
    }

    // ===== BACK OFFICE — ADMIN (Role: ADMIN) =====

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin")
    public ResponseEntity<FetalMilestone> create(
            @RequestBody FetalMilestone milestone) {
        return ResponseEntity.ok(
                fetalMilestoneService.create(milestone)
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/{id}")
    public ResponseEntity<FetalMilestone> update(
            @PathVariable Long id,
            @RequestBody FetalMilestone milestone) {
        return ResponseEntity.ok(
                fetalMilestoneService.update(id, milestone)
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {
        fetalMilestoneService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/all")
    public ResponseEntity<List<FetalMilestone>> getAllAdmin() {
        return ResponseEntity.ok(
                fetalMilestoneService.getAll()
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/{id}")
    public ResponseEntity<FetalMilestone> getByIdAdmin(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                fetalMilestoneService.getById(id)
        );
    }
}