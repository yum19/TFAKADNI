package tn.esprit.backend.module6b.service;

import tn.esprit.backend.module6b.dto.MoodLogRequestDto;
import tn.esprit.backend.module6b.dto.MoodLogResponseDto;

import java.util.List;

public interface IMoodLogService {

    MoodLogResponseDto createMoodLog(String email, MoodLogRequestDto dto);

    List<MoodLogResponseDto> getMoodLogsByMother(String email);

    MoodLogResponseDto getMoodLogById(String email, Long id);

    MoodLogResponseDto updateMoodLog(String email, Long id, MoodLogRequestDto dto);

    void deleteMoodLog(String email, Long id);
}