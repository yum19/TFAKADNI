package tn.esprit.backend.module6a.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6a.dto.BabyAppointmentRequestDTO;
import tn.esprit.backend.module6a.dto.BabyAppointmentResponseDTO;
import tn.esprit.backend.module6a.service.IBabyAppointmentService;

import java.util.List;

@RestController
@RequestMapping("/api/babies/{babyId}/appointments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class BabyAppointmentController {

    private final IBabyAppointmentService babyAppointmentService;

    @PostMapping
    public ResponseEntity<BabyAppointmentResponseDTO> createAppointment(
            Authentication authentication,
            @PathVariable Long babyId,
            @Valid @RequestBody BabyAppointmentRequestDTO request
    ) {
        String email = authentication.getName();
        BabyAppointmentResponseDTO response =
                babyAppointmentService.createAppointment(email, babyId, request);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<BabyAppointmentResponseDTO>> getAllAppointmentsByBaby(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(
                babyAppointmentService.getAllAppointmentsByBaby(email, babyId)
        );
    }

    @GetMapping("/{appointmentId}")
    public ResponseEntity<BabyAppointmentResponseDTO> getAppointmentById(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long appointmentId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(
                babyAppointmentService.getAppointmentById(email, babyId, appointmentId)
        );
    }

    @PutMapping("/{appointmentId}")
    public ResponseEntity<BabyAppointmentResponseDTO> updateAppointment(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long appointmentId,
            @Valid @RequestBody BabyAppointmentRequestDTO request
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(
                babyAppointmentService.updateAppointment(email, babyId, appointmentId, request)
        );
    }

    @DeleteMapping("/{appointmentId}")
    public ResponseEntity<String> deleteAppointment(
            Authentication authentication,
            @PathVariable Long babyId,
            @PathVariable Long appointmentId
    ) {
        String email = authentication.getName();
        babyAppointmentService.deleteAppointment(email, babyId, appointmentId);

        return ResponseEntity.ok("Appointment deleted successfully");
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<BabyAppointmentResponseDTO>> getUpcomingAppointments(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(
                babyAppointmentService.getUpcomingAppointments(email, babyId)
        );
    }

    @GetMapping("/history")
    public ResponseEntity<List<BabyAppointmentResponseDTO>> getAppointmentHistory(
            Authentication authentication,
            @PathVariable Long babyId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(
                babyAppointmentService.getAppointmentHistory(email, babyId)
        );
    }
}