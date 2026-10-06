package tn.esprit.backend.module6a.service;

import tn.esprit.backend.module6a.dto.SleepLogRequestDTO;
import tn.esprit.backend.module6a.dto.SleepLogResponseDTO;

import java.util.List;

public interface ISleepLogService {

    SleepLogResponseDTO createSleepLog(String email, Long babyId, SleepLogRequestDTO request);

    List<SleepLogResponseDTO> getAllSleepLogsByBaby(String email, Long babyId);

    SleepLogResponseDTO getSleepLogById(String email, Long babyId, Long sleepLogId);

    SleepLogResponseDTO updateSleepLog(String email, Long babyId, Long sleepLogId, SleepLogRequestDTO request);

    void deleteSleepLog(String email, Long babyId, Long sleepLogId);
}