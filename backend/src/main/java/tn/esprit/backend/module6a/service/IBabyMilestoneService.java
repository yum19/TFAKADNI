package tn.esprit.backend.module6a.service;

import org.springframework.web.multipart.MultipartFile;
import tn.esprit.backend.module6a.dto.BabyMilestoneResponseDTO;

import java.time.LocalDate;
import java.util.List;

public interface IBabyMilestoneService {

    BabyMilestoneResponseDTO createBabyMilestone(
            String email,
            Long babyId,
            String title,
            String category,
            LocalDate milestoneDate,
            String description,
            String mediaType,
            MultipartFile mediaFile
    );

    List<BabyMilestoneResponseDTO> getAllMilestonesByBaby(String email, Long babyId);

    BabyMilestoneResponseDTO getMilestoneById(String email, Long babyId, Long milestoneId);

    BabyMilestoneResponseDTO updateMilestone(
            String email,
            Long babyId,
            Long milestoneId,
            String title,
            String category,
            LocalDate milestoneDate,
            String description,
            String mediaType,
            MultipartFile mediaFile
    );

    void deleteMilestone(String email, Long babyId, Long milestoneId);

    BabyMilestoneResponseDTO getLatestMilestone(String email, Long babyId);

    List<BabyMilestoneResponseDTO> getMilestonesByCategory(String email, Long babyId, String category);
}