package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.entity.AlertRule;
import tn.esprit.backend.service.impl.AlertRuleService;

import java.util.List;

@RestController
@RequestMapping("/api/alert-rules")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AlertRuleController {

    private final AlertRuleService alertRuleService;

    // ===== FRONT OFFICE — FEMME (Role: USER) =====

    @PreAuthorize("hasRole('USER')")
    @PostMapping
    public ResponseEntity<AlertRule> create(
            @RequestBody AlertRule rule) {
        return ResponseEntity.ok(
                alertRuleService.create(rule)
        );
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/me")
    public ResponseEntity<List<AlertRule>> getMyRules() {
        return ResponseEntity.ok(
                alertRuleService.getMyRules()
        );
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}")
    public ResponseEntity<AlertRule> update(
            @PathVariable Long id,
            @RequestBody AlertRule rule) {
        return ResponseEntity.ok(
                alertRuleService.update(id, rule)
        );
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}/toggle")
    public ResponseEntity<AlertRule> toggle(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                alertRuleService.toggle(id)
        );
    }

    @PreAuthorize("hasRole('USER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {
        alertRuleService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ===== BACK OFFICE — ADMIN (Role: ADMIN) =====

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/all")
    public ResponseEntity<List<AlertRule>> getAllAdmin() {
        return ResponseEntity.ok(
                alertRuleService.getAllRules()
        );
    }
}