package tn.esprit.backend.module6b.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6b.dto.PsychAppointmentRequestDto;
import tn.esprit.backend.module6b.dto.PsychAppointmentResponseDto;
import tn.esprit.backend.module6b.service.IPsychAppointmentService;

import java.util.List;

@RestController
@RequestMapping("/api/postpartum/psych-appointments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class PsychAppointmentController {

    private final IPsychAppointmentService psychAppointmentService;

    @PostMapping
    public PsychAppointmentResponseDto createAppointment(
            Authentication authentication,
            @Valid @RequestBody PsychAppointmentRequestDto appointment
    ) {
        String email = authentication.getName();
        return psychAppointmentService.createAppointment(email, appointment);
    }

    @GetMapping
    public List<PsychAppointmentResponseDto> getAppointmentsByMother(
            Authentication authentication,
            @RequestParam(required = false) String status
    ) {
        String email = authentication.getName();
        if (status != null && !status.isBlank()) {
            return psychAppointmentService.getAppointmentsByMotherAndStatus(email, status);
        }
        return psychAppointmentService.getAppointmentsByMother(email);
    }

    @GetMapping("/{id}")
    public PsychAppointmentResponseDto getAppointmentById(
            Authentication authentication,
            @PathVariable Long id
    ) {
        String email = authentication.getName();
        return psychAppointmentService.getAppointmentById(email, id);
    }

    @PutMapping("/{id}")
    public PsychAppointmentResponseDto updateAppointment(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody PsychAppointmentRequestDto appointment
    ) {
        String email = authentication.getName();
        return psychAppointmentService.updateAppointment(email, id, appointment);
    }

    @DeleteMapping("/{id}")
    public String deleteAppointment(
            Authentication authentication,
            @PathVariable Long id
    ) {
        String email = authentication.getName();
        psychAppointmentService.deleteAppointment(email, id);
        return "PsychAppointment deleted successfully";
    }
}