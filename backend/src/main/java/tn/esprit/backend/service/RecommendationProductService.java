package tn.esprit.backend.service;

import tn.esprit.backend.dto.RecommendationResponse;

import java.util.List;

public interface RecommendationProductService {
    List<RecommendationResponse> getProductRecommendations(String email);
}