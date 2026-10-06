package tn.esprit.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.request.PartnerNoteRequest;
import tn.esprit.backend.dto.response.PartnerNoteResponse;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.mapper.PartnerAndLearningResponseMapper;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.PartnerNoteService;

import java.util.List;

@RestController
@RequestMapping("api/partner/partner-notes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER','PARTNER')")
public class PartnerNoteController {

    private final PartnerNoteService partnerNoteService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<PartnerNoteResponse> createNote(@Valid @RequestBody PartnerNoteRequest request,
                                                          Authentication authentication) {
        request.setAuthorId(getCurrentUserId(authentication));
        return ResponseEntity.ok(PartnerAndLearningResponseMapper.
                toPartnerNoteResponse(partnerNoteService.createNote(request)));
    }

    @GetMapping("/pregnancy/{pregnancyId}")
    public ResponseEntity<List<PartnerNoteResponse>> getByPregnancy(@PathVariable Long pregnancyId,
                                                                    Authentication  authentication) {
        Long currentUserId = getCurrentUserId(authentication);
        return ResponseEntity.ok(
                partnerNoteService.getNotesByPregnancy(pregnancyId, currentUserId)
                        .stream()
                        .map(PartnerAndLearningResponseMapper::toPartnerNoteResponse)
                        .toList()
        );
    }

    @GetMapping("/inbox/me")
    public ResponseEntity<List<PartnerNoteResponse>> getInbox(Authentication authentication) {

        Long recipientId = getCurrentUserId(authentication);

        return ResponseEntity.ok(
                partnerNoteService.getInbox(recipientId)
                        .stream()
                        .map(PartnerAndLearningResponseMapper::toPartnerNoteResponse)
                        .toList()
        );
    }

    @GetMapping("/inbox/me/unread-count")
    public ResponseEntity<Long> countUnread(Authentication authentication) {

        Long recipientId = getCurrentUserId(authentication);

        return ResponseEntity.ok(partnerNoteService.countUnread(recipientId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<PartnerNoteResponse> markAsRead(@PathVariable Long id,
                                                          Authentication authentication) {
        Long currentUserId = getCurrentUserId(authentication);
        return ResponseEntity.ok(PartnerAndLearningResponseMapper
                .toPartnerNoteResponse(partnerNoteService.markAsRead(id, currentUserId)));

    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        Long currentUserId = getCurrentUserId(authentication);
        partnerNoteService.deleteNote(id, currentUserId);
        return ResponseEntity.noContent().build();
    }

    private Long getCurrentUserId(Authentication authentication) {
        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"))
                .getId();
    }

}
