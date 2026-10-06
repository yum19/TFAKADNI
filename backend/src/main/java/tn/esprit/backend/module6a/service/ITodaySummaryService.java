package tn.esprit.backend.module6a.service;

import tn.esprit.backend.module6a.dto.TodaySummaryResponseDTO;

public interface ITodaySummaryService {

    TodaySummaryResponseDTO getTodaySummary(String email, Long babyId);
}