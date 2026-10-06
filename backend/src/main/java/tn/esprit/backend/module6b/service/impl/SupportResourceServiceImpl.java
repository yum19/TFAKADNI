package tn.esprit.backend.module6b.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.backend.module6b.dto.SupportResourceRequestDto;
import tn.esprit.backend.module6b.dto.SupportResourceResponseDto;
import tn.esprit.backend.module6b.entity.SupportResource;
import tn.esprit.backend.module6b.exception.PostpartumRecordMissingException;
import tn.esprit.backend.module6b.repository.SupportResourceRepository;
import tn.esprit.backend.module6b.service.ISupportResourceService;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class SupportResourceServiceImpl implements ISupportResourceService {

    private final SupportResourceRepository supportResourceRepository;

    @Override
    public List<SupportResourceResponseDto> getAllActiveResources() {
        return supportResourceRepository.findByIsActiveTrueOrderByIdDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public SupportResourceResponseDto getResourceById(Long id) {
        SupportResource resource = supportResourceRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("SupportResource not found with id: " + id));
        return mapToResponse(resource);
    }

    @Override
    public List<SupportResourceResponseDto> getResourcesByRiskLevel(String riskLevel) {
        if (isBlank(riskLevel)) {
            return getAllActiveResources();
        }

        String normalizedRisk = normalize(riskLevel);
        return supportResourceRepository.findByIsActiveTrueAndRiskLevelTargetIn(List.of(normalizedRisk, "ALL"))
                .stream()
                .sorted(Comparator.comparing(SupportResource::getId).reversed())
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<SupportResourceResponseDto> getResourcesForMother(
            String riskLevel,
            String type,
            String category,
            String language,
            String search
    ) {
        return supportResourceRepository.findByIsActiveTrueOrderByIdDesc()
                .stream()
                .filter(resource -> matchesRisk(resource, riskLevel))
                .filter(resource -> matchesField(resource.getType(), type))
                .filter(resource -> matchesField(resource.getCategory(), category))
                .filter(resource -> matchesField(resource.getLanguage(), language))
                .filter(resource -> matchesSearch(resource, search))
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<SupportResourceResponseDto> getRecommendedResources(String riskLevel, String language) {
        return supportResourceRepository.findByIsActiveTrue()
                .stream()
                .filter(resource -> Boolean.TRUE.equals(resource.getIsRecommended()) || matchesRisk(resource, riskLevel))
                .sorted((a, b) -> Integer.compare(
                        recommendationScore(b, riskLevel, language),
                        recommendationScore(a, riskLevel, language)
                ))
                .limit(6)
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<SupportResourceResponseDto> getAllResourcesAdmin() {
        return supportResourceRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(SupportResource::getId).reversed())
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public SupportResourceResponseDto createResource(SupportResourceRequestDto dto) {
        validateResource(dto);

        SupportResource resource = SupportResource.builder()
                .title(clean(dto.getTitle()))
                .type(normalize(dto.getType()))
                .category(clean(dto.getCategory()))
                .description(clean(dto.getDescription()))
                .url(clean(dto.getUrl()))
                .contentText(clean(dto.getContentText()))
                .phoneNumber(clean(dto.getPhoneNumber()))
                .thumbnailUrl(clean(dto.getThumbnailUrl()))
                .displayMode(resolveDisplayMode(dto))
                .estimatedMinutes(dto.getEstimatedMinutes())
                .isRecommended(dto.getIsRecommended() != null ? dto.getIsRecommended() : false)
                .language(normalize(dto.getLanguage()))
                .riskLevelTarget(normalize(dto.getRiskLevelTarget()))
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();

        return mapToResponse(supportResourceRepository.save(resource));
    }

    @Override
    public SupportResourceResponseDto updateResource(Long id, SupportResourceRequestDto dto) {
        validateResource(dto);

        SupportResource existing = supportResourceRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("SupportResource not found with id: " + id));

        existing.setTitle(clean(dto.getTitle()));
        existing.setType(normalize(dto.getType()));
        existing.setCategory(clean(dto.getCategory()));
        existing.setDescription(clean(dto.getDescription()));
        existing.setUrl(clean(dto.getUrl()));
        existing.setContentText(clean(dto.getContentText()));
        existing.setPhoneNumber(clean(dto.getPhoneNumber()));
        existing.setThumbnailUrl(clean(dto.getThumbnailUrl()));
        existing.setDisplayMode(resolveDisplayMode(dto));
        existing.setEstimatedMinutes(dto.getEstimatedMinutes());
        existing.setIsRecommended(dto.getIsRecommended() != null ? dto.getIsRecommended() : false);
        existing.setLanguage(normalize(dto.getLanguage()));
        existing.setRiskLevelTarget(normalize(dto.getRiskLevelTarget()));

        if (dto.getIsActive() != null) {
            existing.setIsActive(dto.getIsActive());
        }

        return mapToResponse(supportResourceRepository.save(existing));
    }

    @Override
    public void deleteResource(Long id) {
        SupportResource resource = supportResourceRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("SupportResource not found with id: " + id));

        resource.setIsActive(false);
        supportResourceRepository.save(resource);
    }

    @Override
    public SupportResourceResponseDto activateResource(Long id) {
        SupportResource resource = supportResourceRepository.findById(id)
                .orElseThrow(() -> new PostpartumRecordMissingException("SupportResource not found with id: " + id));

        resource.setIsActive(true);
        return mapToResponse(supportResourceRepository.save(resource));
    }

    private void validateResource(SupportResourceRequestDto dto) {
        String type = normalize(dto.getType());

        if (isBlank(dto.getTitle())) {
            throw new IllegalArgumentException("Title is required");
        }

        if (isBlank(dto.getCategory())) {
            throw new IllegalArgumentException("Category is required");
        }

        if (isBlank(dto.getLanguage())) {
            throw new IllegalArgumentException("Language is required");
        }

        if (isBlank(dto.getRiskLevelTarget())) {
            throw new IllegalArgumentException("Risk level target is required");
        }

        switch (type) {
            case "VIDEO", "AUDIO" -> {
                if (isBlank(dto.getUrl())) {
                    throw new IllegalArgumentException(type + " resource requires a media URL");
                }
            }
            case "ARTICLE" -> {
                if (isBlank(dto.getContentText()) && isBlank(dto.getUrl())) {
                    throw new IllegalArgumentException("ARTICLE resource requires contentText or url");
                }
            }
            case "HOTLINE" -> {
                if (isBlank(dto.getPhoneNumber())) {
                    throw new IllegalArgumentException("HOTLINE resource requires phoneNumber");
                }
            }
            default -> throw new IllegalArgumentException("Unsupported resource type: " + dto.getType());
        }
    }

    private String resolveDisplayMode(SupportResourceRequestDto dto) {
        if (!isBlank(dto.getDisplayMode())) {
            return normalize(dto.getDisplayMode());
        }

        String type = normalize(dto.getType());
        return switch (type) {
            case "VIDEO", "AUDIO" -> "MEDIA";
            case "ARTICLE" -> "TEXT";
            case "HOTLINE" -> "PHONE";
            default -> "LINK";
        };
    }

    private boolean matchesRisk(SupportResource resource, String riskLevel) {
        if (isBlank(riskLevel)) {
            return true;
        }

        String normalizedRisk = normalize(riskLevel);
        String target = normalize(resource.getRiskLevelTarget());

        return "ALL".equals(target) || normalizedRisk.equals(target);
    }

    private boolean matchesField(String resourceValue, String filterValue) {
        if (isBlank(filterValue)) {
            return true;
        }
        return normalize(resourceValue).equals(normalize(filterValue));
    }

    private boolean matchesSearch(SupportResource resource, String search) {
        if (isBlank(search)) {
            return true;
        }

        String q = search.trim().toLowerCase(Locale.ROOT);

        String haystack = String.join(" ",
                safe(resource.getTitle()),
                safe(resource.getDescription()),
                safe(resource.getCategory()),
                safe(resource.getType()),
                safe(resource.getLanguage()),
                safe(resource.getRiskLevelTarget()),
                safe(resource.getContentText()),
                safe(resource.getPhoneNumber())
        ).toLowerCase(Locale.ROOT);

        return haystack.contains(q);
    }

    private int recommendationScore(SupportResource resource, String riskLevel, String language) {
        int score = 0;

        if (Boolean.TRUE.equals(resource.getIsRecommended())) {
            score += 50;
        }

        if (matchesRisk(resource, riskLevel)) {
            score += 30;
        }

        if (!isBlank(language) && normalize(language).equals(normalize(resource.getLanguage()))) {
            score += 15;
        }

        if ("HOTLINE".equals(normalize(resource.getType()))) {
            score += 8;
        }

        if ("ARTICLE".equals(normalize(resource.getType()))) {
            score += 5;
        }

        return score;
    }

    private SupportResourceResponseDto mapToResponse(SupportResource resource) {
        return SupportResourceResponseDto.builder()
                .id(resource.getId())
                .title(resource.getTitle())
                .type(resource.getType())
                .category(resource.getCategory())
                .description(resource.getDescription())
                .url(resource.getUrl())
                .contentText(resource.getContentText())
                .phoneNumber(resource.getPhoneNumber())
                .thumbnailUrl(resource.getThumbnailUrl())
                .displayMode(resource.getDisplayMode())
                .estimatedMinutes(resource.getEstimatedMinutes())
                .isRecommended(resource.getIsRecommended())
                .language(resource.getLanguage())
                .riskLevelTarget(resource.getRiskLevelTarget())
                .isActive(resource.getIsActive())
                .build();
    }

    private String clean(String value) {
        if (value == null) return null;
        String cleaned = value.trim();
        return cleaned.isEmpty() ? null : cleaned;
    }

    private String normalize(String value) {
        String cleaned = clean(value);
        return cleaned == null ? null : cleaned.toUpperCase(Locale.ROOT);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}