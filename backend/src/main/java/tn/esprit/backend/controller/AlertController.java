package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.entity.Alert;
import tn.esprit.backend.service.impl.AlertService;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    // ===== FRONT OFFICE — FEMME (Role: USER) =====

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/me")
    public ResponseEntity<List<Alert>> getMyAlerts() {
        return ResponseEntity.ok(
                alertService.getMyAlerts()
        );
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/me/unread")
    public ResponseEntity<List<Alert>> getUnread() {
        return ResponseEntity.ok(
                alertService.getUnread()
        );
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}/read")
    public ResponseEntity<Alert> markAsRead(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                alertService.markAsRead(id)
        );
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}/dismiss")
    public ResponseEntity<Alert> dismiss(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                alertService.dismiss(id)
        );
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/me/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        alertService.markAllAsRead();
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('USER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {
        alertService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ===== BACK OFFICE — ADMIN (Role: ADMIN) =====

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/all")
    public ResponseEntity<List<Alert>> getAllAdmin() {
        return ResponseEntity.ok(
                alertService.getAllAlerts()
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/critical")
    public ResponseEntity<List<Alert>> getCriticalAdmin() {
        return ResponseEntity.ok(
                alertService.getCriticalAlerts()
        );
    }
}