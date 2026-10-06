package tn.esprit.backend.module6b.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.module6b.dto.SupportResourceRequestDto;
import tn.esprit.backend.module6b.dto.SupportResourceResponseDto;
import tn.esprit.backend.module6b.service.ISupportResourceService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/postpartum/resources")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class AdminSupportResourceController {

    private final ISupportResourceService supportResourceService;

    @GetMapping
    public List<SupportResourceResponseDto> getAllResourcesAdmin() {
        return supportResourceService.getAllResourcesAdmin();
    }

    @PostMapping
    public SupportResourceResponseDto createResource(@Valid @RequestBody SupportResourceRequestDto resource) {
        return supportResourceService.createResource(resource);
    }

    @PutMapping("/{id}")
    public SupportResourceResponseDto updateResource(
            @PathVariable Long id,
            @Valid @RequestBody SupportResourceRequestDto resource
    ) {
        return supportResourceService.updateResource(id, resource);
    }

    @DeleteMapping("/{id}")
    public String deleteResource(@PathVariable Long id) {
        supportResourceService.deleteResource(id);
        return "SupportResource deactivated successfully";
    }

    @PutMapping("/{id}/activate")
    public SupportResourceResponseDto activateResource(@PathVariable Long id) {
        return supportResourceService.activateResource(id);
    }
}