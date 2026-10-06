package tn.esprit.backend.module6b.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6b.dto.PredictionResultResponseDto;
import tn.esprit.backend.module6b.dto.ScreeningAssessmentRequestDto;
import tn.esprit.backend.module6b.dto.ScreeningAssessmentResponseDto;
import tn.esprit.backend.module6b.service.IScreeningService;

import java.util.List;

@RestController
@RequestMapping("/api/postpartum/screenings")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class ScreeningController {

    private final IScreeningService screeningService;

    @PostMapping
    public PredictionResultResponseDto createScreening(
            Authentication authentication,
            @Valid @RequestBody ScreeningAssessmentRequestDto screening
    ) {
        String email = authentication.getName();
        System.out.println(email);
        return screeningService.createScreening(email, screening);
    }

    @GetMapping
    public List<ScreeningAssessmentResponseDto> getScreeningsByMother(Authentication authentication) {
        String email = authentication.getName();
        return screeningService.getScreeningsByMother(email);
    }

    @GetMapping("/{id}")
    public ScreeningAssessmentResponseDto getScreeningById(
            Authentication authentication,
            @PathVariable Long id
    ) {
        String email = authentication.getName();
        return screeningService.getScreeningById(email, id);
    }

    @GetMapping("/latest")
    public ScreeningAssessmentResponseDto getLatestScreeningByMother(Authentication authentication) {
        String email = authentication.getName();
        return screeningService.getLatestScreeningByMother(email);
    }

    @DeleteMapping("/{id}")
    public String deleteScreening(
            Authentication authentication,
            @PathVariable Long id
    ) {
        String email = authentication.getName();
        screeningService.deleteScreening(email, id);
        return "Screening deleted successfully";
    }

    @GetMapping("/predictions")
    public List<PredictionResultResponseDto> getPredictionsByMother(Authentication authentication) {
        String email = authentication.getName();
        return screeningService.getPredictionsByMother(email);
    }

    @GetMapping("/predictions/{id}")
    public PredictionResultResponseDto getPredictionById(
            Authentication authentication,
            @PathVariable Long id
    ) {
        String email = authentication.getName();
        return screeningService.getPredictionById(email, id);
    }

    @GetMapping("/predictions/latest")
    public PredictionResultResponseDto getLatestPredictionByMother(Authentication authentication) {
        String email = authentication.getName();
        return screeningService.getLatestPredictionByMother(email);
    }
}