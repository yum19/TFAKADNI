package tn.esprit.backend.module6b.service;

import tn.esprit.backend.module6b.dto.SupportResourceRequestDto;
import tn.esprit.backend.module6b.dto.SupportResourceResponseDto;

import java.util.List;

public interface ISupportResourceService {

    List<SupportResourceResponseDto> getAllActiveResources();

    SupportResourceResponseDto getResourceById(Long id);

    List<SupportResourceResponseDto> getResourcesByRiskLevel(String riskLevel);

    List<SupportResourceResponseDto> getResourcesForMother(
            String riskLevel,
            String type,
            String category,
            String language,
            String search
    );

    List<SupportResourceResponseDto> getRecommendedResources(String riskLevel, String language);

    List<SupportResourceResponseDto> getAllResourcesAdmin();

    SupportResourceResponseDto createResource(SupportResourceRequestDto dto);

    SupportResourceResponseDto updateResource(Long id, SupportResourceRequestDto dto);

    void deleteResource(Long id);

    SupportResourceResponseDto activateResource(Long id);
}