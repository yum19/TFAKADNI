package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.ReportRequestDTO;
import tn.esprit.backend.service.ReportService;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReportPostController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<Void> report(Authentication authentication,
                                       @RequestBody ReportRequestDTO dto) {
        reportService.reportPost(authentication.getName(), dto);
        return ResponseEntity.ok().build();
    }
}