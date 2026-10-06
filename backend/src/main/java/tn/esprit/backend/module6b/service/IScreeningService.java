package tn.esprit.backend.module6b.service;

import tn.esprit.backend.module6b.dto.PredictionResultResponseDto;
import tn.esprit.backend.module6b.dto.ScreeningAssessmentRequestDto;
import tn.esprit.backend.module6b.dto.ScreeningAssessmentResponseDto;

import java.util.List;

public interface IScreeningService {

    PredictionResultResponseDto createScreening(String email, ScreeningAssessmentRequestDto dto);

    List<ScreeningAssessmentResponseDto> getScreeningsByMother(String email);

    ScreeningAssessmentResponseDto getScreeningById(String email, Long id);

    ScreeningAssessmentResponseDto getLatestScreeningByMother(String email);

    void deleteScreening(String email, Long id);

    List<PredictionResultResponseDto> getPredictionsByMother(String email);

    PredictionResultResponseDto getPredictionById(String email, Long id);

    PredictionResultResponseDto getLatestPredictionByMother(String email);
}