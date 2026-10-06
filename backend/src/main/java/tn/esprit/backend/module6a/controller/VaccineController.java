package tn.esprit.backend.module6a.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6a.dto.VaccineRequestDTO;
import tn.esprit.backend.module6a.dto.VaccineResponseDTO;
import tn.esprit.backend.module6a.service.IVaccineService;

import java.util.List;

@RestController
@RequestMapping("/api/babies/{babyId}/vaccines")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class VaccineController {

    private final IVaccineService vaccineService;

    @PostMapping
    public ResponseEntity<VaccineResponseDTO> createVaccine(
            Authentication authentication,
            @PathVariable Long babyId,
            @Valid @RequestBody VaccineRequestDTO request
    ) {
        String email = authentication.getName();
        VaccineResponseDTO response = vaccineService.createVaccine(email, babyId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<VaccineResponseDTO>> getAllVaccinesByBaby(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(vaccineService.getAllVaccinesByBaby(email, babyId));
    }

    @GetMapping("/{vaccineId}")
    public ResponseEntity<VaccineResponseDTO> getVaccineById(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long vaccineId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(vaccineService.getVaccineById(email, babyId, vaccineId));
    }

    @PutMapping("/{vaccineId}")
    public ResponseEntity<VaccineResponseDTO> updateVaccine(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long vaccineId,
            @Valid @RequestBody VaccineRequestDTO request
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(vaccineService.updateVaccine(email, babyId, vaccineId, request));
    }

    @DeleteMapping("/{vaccineId}")
    public ResponseEntity<String> deleteVaccine(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long vaccineId
    ) {
        String email = authentication.getName();
        vaccineService.deleteVaccine(email, babyId, vaccineId);
        return ResponseEntity.ok("Vaccine deleted successfully");
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<VaccineResponseDTO>> getUpcomingVaccines(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(vaccineService.getUpcomingVaccines(email, babyId));
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<VaccineResponseDTO>> getOverdueVaccines(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(vaccineService.getOverdueVaccines(email, babyId));
    }
}