package tn.esprit.backend.module6a.service;

import tn.esprit.backend.module6a.dto.BabyDashboardResponseDTO;

public interface IDashboardService {

    BabyDashboardResponseDTO getDashboard(String email, Long babyId);
}