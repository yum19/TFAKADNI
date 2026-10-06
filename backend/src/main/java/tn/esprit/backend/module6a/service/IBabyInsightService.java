package tn.esprit.backend.module6a.service;

import tn.esprit.backend.module6a.dto.BabyInsightResponseDTO;

import java.util.List;

public interface IBabyInsightService {

    List<BabyInsightResponseDTO> getAllInsightsByBaby(String email, Long babyId);

    List<BabyInsightResponseDTO> getUnreadInsightsByBaby(String email, Long babyId);

    BabyInsightResponseDTO markAsRead(String email, Long babyId, Long insightId);

    BabyInsightResponseDTO dismissInsight(String email, Long babyId, Long insightId);

    BabyInsightResponseDTO resolveInsight(String email, Long babyId, Long insightId);

    void markAllAsRead(String email, Long babyId);

    List<BabyInsightResponseDTO> generateInsightsForBaby(String email, Long babyId);
}