package tn.esprit.backend.module6a.service;

import tn.esprit.backend.module6a.dto.GrowthRecordRequestDTO;
import tn.esprit.backend.module6a.dto.GrowthRecordResponseDTO;

import java.util.List;
import java.util.Map;

public interface IGrowthRecordService {

    GrowthRecordResponseDTO createGrowthRecord(String email, Long babyId, GrowthRecordRequestDTO request);

    List<GrowthRecordResponseDTO> getAllGrowthRecordsByBaby(String email, Long babyId);

    GrowthRecordResponseDTO getGrowthRecordById(String email, Long babyId, Long recordId);

    GrowthRecordResponseDTO updateGrowthRecord(String email, Long babyId, Long recordId, GrowthRecordRequestDTO request);

    void deleteGrowthRecord(String email, Long babyId, Long recordId);

    GrowthRecordResponseDTO getLatestGrowthRecord(String email, Long babyId);

    List<GrowthRecordResponseDTO> getGrowthChart(String email, Long babyId);

    Map<String, Object> getGrowthAnalysis(String email, Long babyId);
}