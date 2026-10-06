package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.entity.PrenatalExam;
import tn.esprit.backend.service.impl.PrenatalExamService;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PrenatalExamController {

    private final PrenatalExamService prenatalExamService;

    // ===== FRONT OFFICE — FEMME (Role: USER) =====

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/pregnancy/{pregnancyId}")
    public ResponseEntity<List<PrenatalExam>> getByPregnancy(
            @PathVariable Long pregnancyId) {
        return ResponseEntity.ok(
                prenatalExamService.getByPregnancy(pregnancyId)
        );
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/pregnancy/{pregnancyId}/pending")
    public ResponseEntity<List<PrenatalExam>> getPending(
            @PathVariable Long pregnancyId) {
        return ResponseEntity.ok(
                prenatalExamService.getPending(pregnancyId)
        );
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/pregnancy/{pregnancyId}")
    public ResponseEntity<PrenatalExam> create(
            @PathVariable Long pregnancyId,
            @RequestBody PrenatalExam exam) {
        return ResponseEntity.ok(
                prenatalExamService.create(pregnancyId, exam)
        );
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{examId}/done")
    public ResponseEntity<PrenatalExam> markAsDone(
            @PathVariable Long examId,
            @RequestBody PrenatalExam exam) {
        return ResponseEntity.ok(
                prenatalExamService.markAsDone(examId, exam)
        );
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{examId}")
    public ResponseEntity<PrenatalExam> update(
            @PathVariable Long examId,
            @RequestBody PrenatalExam exam) {
        return ResponseEntity.ok(
                prenatalExamService.update(examId, exam)
        );
    }

    @PreAuthorize("hasRole('USER')")
    @DeleteMapping("/{examId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long examId) {
        prenatalExamService.delete(examId);
        return ResponseEntity.noContent().build();
    }

    // ===== PARTNER OFFICE — PARTENAIRE (Role: PARTNER) =====

    @PreAuthorize("hasRole('PARTNER')")
    @GetMapping("/partner/pregnancy/{pregnancyId}")
    public ResponseEntity<List<PrenatalExam>> getForPartner(
            @PathVariable Long pregnancyId) {
        // The service logic should handle verifying if the pregnancy is shared
        return ResponseEntity.ok(
                prenatalExamService.getByPregnancy(pregnancyId)
        );
    }

    // ===== BACK OFFICE — ADMIN (Role: ADMIN) =====

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/all")
    public ResponseEntity<List<PrenatalExam>> getAllAdmin() {
        return ResponseEntity.ok(
                prenatalExamService.getAllExams()
        );
    }
}