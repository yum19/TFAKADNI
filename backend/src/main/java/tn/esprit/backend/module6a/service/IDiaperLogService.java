package tn.esprit.backend.module6a.service;

import tn.esprit.backend.module6a.dto.DiaperLogRequestDTO;
import tn.esprit.backend.module6a.dto.DiaperLogResponseDTO;

import java.util.List;

public interface IDiaperLogService {

    DiaperLogResponseDTO createDiaperLog(String email, Long babyId, DiaperLogRequestDTO request);

    List<DiaperLogResponseDTO> getAllDiaperLogsByBaby(String email, Long babyId);

    DiaperLogResponseDTO getDiaperLogById(String email, Long babyId, Long diaperLogId);

    DiaperLogResponseDTO updateDiaperLog(String email, Long babyId, Long diaperLogId, DiaperLogRequestDTO request);

    void deleteDiaperLog(String email, Long babyId, Long diaperLogId);

    List<DiaperLogResponseDTO> getTodayDiaperLogs(String email, Long babyId);
}