package tn.esprit.backend.module6a.service;

import tn.esprit.backend.module6a.dto.BabyPredictionResponseDTO;
import tn.esprit.backend.module6a.dto.BabyRhythmProfileResponseDTO;

public interface IBabyRhythmService {

    BabyRhythmProfileResponseDTO recalculateRhythmProfile(String email, Long babyId);

    BabyRhythmProfileResponseDTO getRhythmProfile(String email, Long babyId);

    BabyPredictionResponseDTO predictNextFeeding(String email, Long babyId);

    BabyPredictionResponseDTO predictNextSleep(String email, Long babyId);

    void recalculateRhythmProfileByBabyId(Long babyId);
}