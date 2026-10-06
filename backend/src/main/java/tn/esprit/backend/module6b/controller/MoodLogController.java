package tn.esprit.backend.module6b.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6b.dto.MoodLogRequestDto;
import tn.esprit.backend.module6b.dto.MoodLogResponseDto;
import tn.esprit.backend.module6b.service.IMoodLogService;

import java.util.List;

@RestController
@RequestMapping("/api/postpartum/mood-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class MoodLogController {

    private final IMoodLogService moodLogService;

    @PostMapping
    public MoodLogResponseDto createMoodLog(
            Authentication authentication,
            @Valid @RequestBody MoodLogRequestDto moodLog
    ) {
        String email = authentication.getName();
        return moodLogService.createMoodLog(email, moodLog);
    }

    @GetMapping
    public List<MoodLogResponseDto> getMoodLogsByMother(Authentication authentication) {
        String email = authentication.getName();
        return moodLogService.getMoodLogsByMother(email);
    }

    @GetMapping("/{id}")
    public MoodLogResponseDto getMoodLogById(
            Authentication authentication,
            @PathVariable Long id
    ) {
        String email = authentication.getName();
        return moodLogService.getMoodLogById(email, id);
    }

    @PutMapping("/{id}")
    public MoodLogResponseDto updateMoodLog(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody MoodLogRequestDto moodLog
    ) {
        String email = authentication.getName();
        return moodLogService.updateMoodLog(email, id, moodLog);
    }

    @DeleteMapping("/{id}")
    public String deleteMoodLog(
            Authentication authentication,
            @PathVariable Long id
    ) {
        String email = authentication.getName();
        moodLogService.deleteMoodLog(email, id);
        return "MoodLog deleted successfully";
    }
}