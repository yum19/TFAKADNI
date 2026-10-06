package tn.esprit.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.request.PartnerInviteRequest;
import tn.esprit.backend.dto.request.UpdatePartnerPermissionsRequest;
import tn.esprit.backend.dto.response.PartnerLinkResponse;
import tn.esprit.backend.enumtype.PartnerPermissionType;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.mapper.PartnerLinkMapper;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.PartnerLinkService;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("api/partner/partner-links")
@RequiredArgsConstructor
public class PartnerLinkController {

    private final PartnerLinkService partnerLinkService;
    private final UserRepository userRepository;

    @GetMapping("/permission-types")
    @PreAuthorize("hasAnyRole('USER','PARTNER','ADMIN')")
    public ResponseEntity<List<String>> getPermissionTypes() {
        return ResponseEntity.ok(
                Arrays.stream(PartnerPermissionType.values())
                        .map(Enum::name)
                        .toList()
        );
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<PartnerLinkResponse> createInvite(@Valid @RequestBody PartnerInviteRequest request,
                                                            Authentication authentication) {

        request.setMotherId(getCurrentUserId(authentication));

        return ResponseEntity.ok(PartnerLinkMapper.toResponse(partnerLinkService.createInvite(request)));
    }

    @PutMapping("/{id}/accept")
    @PreAuthorize("hasRole('PARTNER')")
    public ResponseEntity<PartnerLinkResponse> accept(@PathVariable Long id,
                                                      Authentication authentication) {
        Long currentUserId = getCurrentUserId(authentication);
        return ResponseEntity.ok(PartnerLinkMapper.toResponse(partnerLinkService.acceptInvite(id, currentUserId)));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('PARTNER')")
    public ResponseEntity<PartnerLinkResponse> reject(@PathVariable Long id,
                                                      Authentication authentication) {
        Long currentUserId = getCurrentUserId(authentication);
        return ResponseEntity.ok(PartnerLinkMapper.toResponse(partnerLinkService.rejectInvite(id, currentUserId)));
    }

    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<PartnerLinkResponse> updatePermissions(@PathVariable Long id,
                                                                 @Valid @RequestBody UpdatePartnerPermissionsRequest request,
                                                                 Authentication authentication) {
        Long currentUserId = getCurrentUserId(authentication);
        return ResponseEntity.ok(PartnerLinkMapper.toResponse(partnerLinkService.updatePermissions(id, request, currentUserId)));
    }

    @GetMapping("/pregnancy/{pregnancyId}/active")
    @PreAuthorize("hasAnyRole('USER','PARTNER')")
    public ResponseEntity<PartnerLinkResponse> getActiveByPregnancy(@PathVariable Long pregnancyId,
                                                                    Authentication authentication) {
        Long currentUserId = getCurrentUserId(authentication);
        return ResponseEntity.ok(PartnerLinkMapper.toResponse(partnerLinkService.getActiveByPregnancy(pregnancyId, currentUserId)));
    }

    @GetMapping("/me/invites")
    @PreAuthorize("hasRole('PARTNER')")
    public ResponseEntity<List<PartnerLinkResponse>> getMyPartnerInvites(Authentication authentication) {
        Long partnerId = getCurrentUserId(authentication);
        return ResponseEntity.ok(
                partnerLinkService.getPartnerInvites(partnerId).stream()
                        .map(PartnerLinkMapper::toResponse)
                        .toList()
        );
    }

    @GetMapping("/me/mother-links")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<PartnerLinkResponse>> getMyMotherLinks(Authentication authentication) {
        Long motherId = getCurrentUserId(authentication);
        return ResponseEntity.ok(
                partnerLinkService.getMotherLinks(motherId).stream()
                        .map(PartnerLinkMapper::toResponse)
                        .toList()
        );
    }

    private Long getCurrentUserId(Authentication authentication) {
        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"))
                .getId();
    }

}
