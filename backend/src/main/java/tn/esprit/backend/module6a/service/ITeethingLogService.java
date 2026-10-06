package tn.esprit.backend.module6a.service;

import tn.esprit.backend.module6a.dto.TeethingLogRequestDTO;
import tn.esprit.backend.module6a.dto.TeethingLogResponseDTO;

import java.util.List;

public interface ITeethingLogService {

    TeethingLogResponseDTO createTeethingLog(String email, Long babyId, TeethingLogRequestDTO request);

    List<TeethingLogResponseDTO> getAllTeethingLogsByBaby(String email, Long babyId);

    TeethingLogResponseDTO getTeethingLogById(String email, Long babyId, Long teethingLogId);

    TeethingLogResponseDTO updateTeethingLog(String email, Long babyId, Long teethingLogId, TeethingLogRequestDTO request);

    void deleteTeethingLog(String email, Long babyId, Long teethingLogId);

    TeethingLogResponseDTO getLatestTeethingLog(String email, Long babyId);
}