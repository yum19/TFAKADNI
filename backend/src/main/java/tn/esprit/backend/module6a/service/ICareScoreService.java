package tn.esprit.backend.module6a.service;

import tn.esprit.backend.module6a.dto.CareScoreResponseDTO;

public interface ICareScoreService {

    CareScoreResponseDTO getCareScore(String email, Long babyId);
}