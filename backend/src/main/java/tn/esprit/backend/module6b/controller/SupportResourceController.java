package tn.esprit.backend.module6b.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6b.dto.SupportResourceResponseDto;
import tn.esprit.backend.module6b.service.ISupportResourceService;

import java.util.List;

@RestController
@RequestMapping("/api/postpartum/resources")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class SupportResourceController {

    private final ISupportResourceService supportResourceService;

    @GetMapping
    public List<SupportResourceResponseDto> getResources(
            @RequestParam(required = false) String riskLevel,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String search
    ) {
        return supportResourceService.getResourcesForMother(
                riskLevel,
                type,
                category,
                language,
                search
        );
    }

    @GetMapping("/recommended")
    public List<SupportResourceResponseDto> getRecommendedResources(
            @RequestParam(required = false) String riskLevel,
            @RequestParam(required = false) String language
    ) {
        return supportResourceService.getRecommendedResources(riskLevel, language);
    }

    @GetMapping("/{id}")
    public SupportResourceResponseDto getResourceById(@PathVariable Long id) {
        return supportResourceService.getResourceById(id);
    }
}