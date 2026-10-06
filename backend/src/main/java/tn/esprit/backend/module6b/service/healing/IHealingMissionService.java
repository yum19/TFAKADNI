package tn.esprit.backend.module6b.service.healing;

import tn.esprit.backend.module6b.dto.healing.*;

import java.util.List;

public interface IHealingMissionService {
    HealingDashboardResponseDto getDashboard(String email);
    List<HealingMissionResponseDto> getAllMissions(String email);
    List<HealingMissionResponseDto> getTodayMissions(String email);
    HealingMissionResponseDto getMissionById(String email, Long id);
    HealingMissionResponseDto startMission(String email, Long missionId);
    HealingMissionCompleteResponseDto completeMission(String email, Long missionId, HealingMissionCompleteRequestDto request);

    // NEW
    HealingMissionResponseDto failMission(String email, Long missionId);

    HealingMissionResponseDto skipMission(String email, Long missionId);
    List<HealingMissionResponseDto> getHistory(String email);
    HealingStatsResponseDto getStats(String email);
    List<HealingBadgeResponseDto> getAllBadges(String email);
    List<HealingBadgeResponseDto> getMyBadges(String email);
}