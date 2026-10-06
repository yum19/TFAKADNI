package tn.esprit.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.dto.request.PartnerGuideRequest;
import tn.esprit.backend.dto.response.PartnerGuideResponse;
import tn.esprit.backend.mapper.PartnerGuideMapper;
import tn.esprit.backend.service.PartnerGuideService;

import java.util.List;

@RestController
@RequestMapping("/api/partner/partner-guides")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER','PARTNER','ADMIN')")
public class PartnerGuideController {

    private final PartnerGuideService partnerGuideService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PartnerGuideResponse> create(@Valid @RequestBody PartnerGuideRequest request) {
        return ResponseEntity.ok(PartnerGuideMapper.toResponse(partnerGuideService.createPartnerGuide(request)));
    }

    @PutMapping("/{guideId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PartnerGuideResponse> update(@PathVariable Long guideId,
                                                       @Valid @RequestBody PartnerGuideRequest request) {
        return ResponseEntity.ok(PartnerGuideMapper.toResponse(partnerGuideService.updatePartnerGuide(guideId, request)));
    }

    @DeleteMapping("/{guideId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long guideId) {
        partnerGuideService.deletePartnerGuide(guideId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{guideId}")
    public ResponseEntity<PartnerGuideResponse> getById(@PathVariable Long
                                                                guideId) {
        return ResponseEntity.ok(PartnerGuideMapper.toResponse(partnerGuideService.getPartnerGuideById(guideId)));
    }

    @GetMapping
    public ResponseEntity<List<PartnerGuideResponse>> getAll() {
        return ResponseEntity.ok(
                partnerGuideService.getAllGuides().stream()
                        .map(PartnerGuideMapper::toResponse)
                        .toList()
        );
    }
    @GetMapping("/week/{week}")
    public ResponseEntity<List<PartnerGuideResponse>> getByWeek(@PathVariable Integer week) {
        return ResponseEntity.ok(
                partnerGuideService.getGuidesByWeek(week).stream()
                        .map(PartnerGuideMapper::toResponse)
                        .toList()
        );
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<PartnerGuideResponse>> getByCategory(@PathVariable String category) {
        return ResponseEntity.ok(
                partnerGuideService.getGuidesByCategory(category).stream()
                        .map(PartnerGuideMapper::toResponse)
                        .toList()
        );
    }

    @GetMapping("/search")
    public ResponseEntity<List<PartnerGuideResponse>> search(@RequestParam String keyword) {
        return ResponseEntity.ok(
                partnerGuideService.searchPartnerGuides(keyword).stream()
                        .map(PartnerGuideMapper::toResponse)
                        .toList()
        );
    }

}
