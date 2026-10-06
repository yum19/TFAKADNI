package tn.esprit.backend.module6a.service;

import tn.esprit.backend.module6a.dto.FeedingRequestDTO;
import tn.esprit.backend.module6a.dto.FeedingResponseDTO;

import java.util.List;

public interface IFeedingService {

    FeedingResponseDTO createFeeding(String email, Long babyId, FeedingRequestDTO request);

    List<FeedingResponseDTO> getAllFeedingsByBaby(String email, Long babyId);

    FeedingResponseDTO getFeedingById(String email, Long babyId, Long feedingId);

    FeedingResponseDTO updateFeeding(String email, Long babyId, Long feedingId, FeedingRequestDTO request);

    void deleteFeeding(String email, Long babyId, Long feedingId);
}