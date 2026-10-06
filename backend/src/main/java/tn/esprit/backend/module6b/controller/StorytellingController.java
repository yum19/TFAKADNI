package tn.esprit.backend.module6b.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6b.dto.StoryAudioResponseDto;
import tn.esprit.backend.module6b.dto.StoryRequestDto;
import tn.esprit.backend.module6b.dto.StoryResponseDto;
import tn.esprit.backend.module6b.service.IStorytellingService;

import java.util.List;

@RestController
@RequestMapping("/api/postpartum/storytelling")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class StorytellingController {

    private final IStorytellingService storytellingService;

    @PostMapping("/generate")
    public StoryResponseDto generateStory(
            Authentication authentication,
            @RequestBody StoryRequestDto request
    ) {
        String email = authentication.getName();
        return storytellingService.generateStory(email, request);
    }

    @GetMapping("/latest")
    public StoryResponseDto getLatestStory(Authentication authentication) {
        String email = authentication.getName();
        return storytellingService.getLatestStory(email);
    }

    @GetMapping("/history")
    public List<StoryResponseDto> getStoryHistory(Authentication authentication) {
        String email = authentication.getName();
        return storytellingService.getStoryHistory(email);
    }

    @GetMapping("/{id}")
    public StoryResponseDto getStoryById(
            Authentication authentication,
            @PathVariable Long id
    ) {
        String email = authentication.getName();
        return storytellingService.getStoryById(email, id);
    }

    @DeleteMapping("/{id}")
    public String deleteStory(
            Authentication authentication,
            @PathVariable Long id
    ) {
        String email = authentication.getName();
        storytellingService.deleteStory(email, id);
        return "EmotionalStory deleted successfully";
    }

    @PostMapping("/{storyId}/generate-audio")
    public StoryAudioResponseDto generateAudio(
            Authentication authentication,
            @PathVariable Long storyId,
            @RequestParam(required = false) String voiceType
    ) {
        String email = authentication.getName();
        return storytellingService.generateAudioForStory(email, storyId, voiceType);
    }
}