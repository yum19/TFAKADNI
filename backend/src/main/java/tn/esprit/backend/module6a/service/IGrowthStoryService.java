package tn.esprit.backend.module6a.service;

import tn.esprit.backend.module6a.dto.GrowthStoryResponseDTO;

public interface IGrowthStoryService {

    GrowthStoryResponseDTO getGrowthStory(String email, Long babyId);
}