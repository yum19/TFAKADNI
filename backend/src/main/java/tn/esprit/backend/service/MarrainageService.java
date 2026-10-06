package tn.esprit.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.backend.dto.MarraineDTO;
import tn.esprit.backend.repository.MarrainageRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MarrainageService {

    private final MarrainageRepository repository;

    public List<MarraineDTO> findBestMarraines(Long motherUserId) {

        return repository.findTopMarraines(motherUserId)
                .stream()
                .map(p -> MarraineDTO.builder()
                        .userId(p.getUserId())
                        .fullName(p.getFullName())
                        .city(p.getCity())
                        .currentWeek(p.getCurrentWeek())
                        .pregnancyType(p.getPregnancyType())
                        .compatibilityScore(p.getCompatibilityScore())
                        .reason(p.getReason())
                        .hasBaby(p.getHasBaby() != null && p.getHasBaby() == 1)   // ← convert 0/1 to boolean
                        .build()
                )
                .toList();
    }
}