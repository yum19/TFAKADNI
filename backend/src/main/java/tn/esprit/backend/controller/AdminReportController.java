package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.ReportResponseDTO;
import tn.esprit.backend.repository.ReportRepository;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final ReportRepository reportRepository;

    @GetMapping
    public ResponseEntity<List<ReportResponseDTO>> getAllReports() {
        List<ReportResponseDTO> reports = reportRepository.findAll()
                .stream()
                .map(ReportResponseDTO::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reports);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> dismissReport(@PathVariable Long id) {
        reportRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }


}