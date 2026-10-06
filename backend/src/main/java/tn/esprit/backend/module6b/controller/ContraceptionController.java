package tn.esprit.backend.module6b.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6b.dto.*;
import tn.esprit.backend.module6b.service.IContraceptionService;

import java.util.List;

@RestController
@RequestMapping("/api/postpartum/contraception")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class ContraceptionController {

    private final IContraceptionService contraceptionService;

    @PostMapping("/recommend")
    public ContraceptionProfileResponseDto recommendMethod(
            Authentication authentication,
            @Valid @RequestBody ContraceptionProfileRequestDto profile
    ) {
        String email = authentication.getName();
        return contraceptionService.recommendMethod(email, profile);
    }

    @GetMapping("/recommendations")
    public List<ContraceptionProfileResponseDto> getRecommendations(Authentication authentication) {
        String email = authentication.getName();
        return contraceptionService.getProfilesByMother(email);
    }

    @GetMapping("/recommendations/{id}")
    public ContraceptionProfileResponseDto getRecommendationById(
            Authentication authentication,
            @PathVariable Long id
    ) {
        String email = authentication.getName();
        return contraceptionService.getProfileById(email, id);
    }

    @DeleteMapping("/recommendations/{id}")
    public String deleteRecommendation(
            Authentication authentication,
            @PathVariable Long id
    ) {
        String email = authentication.getName();
        contraceptionService.deleteRecommendation(email, id);
        return "ContraceptionProfile deleted successfully";
    }

    @PostMapping("/chat")
    public ContraceptionChatMessageResponseDto sendMessage(
            Authentication authentication,
            @Valid @RequestBody ContraceptionChatRequestDto dto
    ) {
        String email = authentication.getName();
        return contraceptionService.sendChatMessage(email, dto);
    }

    @GetMapping("/chat")
    public List<ContraceptionChatMessageResponseDto> getChatHistory(Authentication authentication) {
        String email = authentication.getName();
        return contraceptionService.getChatHistory(email);
    }

    @GetMapping("/chat/{sessionId}")
    public List<ContraceptionChatMessageResponseDto> getChatSession(
            Authentication authentication,
            @PathVariable String sessionId
    ) {
        String email = authentication.getName();
        return contraceptionService.getChatSession(email, sessionId);
    }

    @DeleteMapping("/chat/{id}")
    public String deleteChatMessage(
            Authentication authentication,
            @PathVariable Long id
    ) {
        String email = authentication.getName();
        contraceptionService.deleteChatMessage(email, id);
        return "ChatMessage deleted successfully";
    }

    @PostMapping
    public ContraceptionLogResponseDto createLog(
            Authentication authentication,
            @Valid @RequestBody ContraceptionLogRequestDto log
    ) {
        String email = authentication.getName();
        return contraceptionService.createLog(email, log);
    }

    @GetMapping
    public List<ContraceptionLogResponseDto> getLogsByMother(
            Authentication authentication,
            @RequestParam(required = false) String status
    ) {
        String email = authentication.getName();
        if (status != null && !status.isBlank()) {
            return contraceptionService.getLogsByMotherAndStatus(email, status);
        }
        return contraceptionService.getLogsByMother(email);
    }

    @GetMapping("/active")
    public ContraceptionLogResponseDto getActiveLog(Authentication authentication) {
        String email = authentication.getName();
        return contraceptionService.getActiveLog(email);
    }

    @GetMapping("/{id}")
    public ContraceptionLogResponseDto getLogById(
            Authentication authentication,
            @PathVariable Long id
    ) {
        String email = authentication.getName();
        return contraceptionService.getLogById(email, id);
    }

    @PutMapping("/{id}")
    public ContraceptionLogResponseDto updateLog(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ContraceptionLogRequestDto log
    ) {
        String email = authentication.getName();
        return contraceptionService.updateLog(email, id, log);
    }

    @PutMapping("/{id}/stop")
    public ContraceptionLogResponseDto stopLog(
            Authentication authentication,
            @PathVariable Long id
    ) {
        String email = authentication.getName();
        return contraceptionService.stopLog(email, id);
    }

    @DeleteMapping("/{id}")
    public String deleteLog(
            Authentication authentication,
            @PathVariable Long id
    ) {
        String email = authentication.getName();
        contraceptionService.deleteLog(email, id);
        return "ContraceptionLog deleted successfully";
    }
    @PutMapping("/chat/{id}")
    public ContraceptionChatMessageResponseDto updateChatMessage(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ContraceptionChatRequestDto dto
    ) {
        String email = authentication.getName();
        return contraceptionService.updateChatMessage(email, id, dto);
    }
}