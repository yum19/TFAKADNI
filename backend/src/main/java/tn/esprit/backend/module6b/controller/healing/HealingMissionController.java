package tn.esprit.backend.module6b.controller.healing;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.backend.module6b.dto.healing.*;
import tn.esprit.backend.module6b.service.healing.IHealingMissionService;
import tn.esprit.backend.module6b.service.healing.IVoiceComfortEvaluationService;

import java.util.List;

@RestController
@RequestMapping("/api/postpartum/healing")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class HealingMissionController {

    private final IHealingMissionService healingMissionService;
    private final IVoiceComfortEvaluationService voiceComfortEvaluationService;

    @GetMapping("/dashboard")
    public HealingDashboardResponseDto getDashboard(Authentication authentication) {
        return healingMissionService.getDashboard(authentication.getName());
    }

    @GetMapping("/missions")
    public List<HealingMissionResponseDto> getAllMissions(Authentication authentication) {
        return healingMissionService.getAllMissions(authentication.getName());
    }

    @GetMapping("/missions/today")
    public List<HealingMissionResponseDto> getTodayMissions(Authentication authentication) {
        return healingMissionService.getTodayMissions(authentication.getName());
    }

    @GetMapping("/missions/{id}")
    public HealingMissionResponseDto getMissionById(Authentication authentication, @PathVariable Long id) {
        return healingMissionService.getMissionById(authentication.getName(), id);
    }

    @PostMapping("/missions/{id}/start")
    public HealingMissionResponseDto startMission(Authentication authentication, @PathVariable Long id) {
        return healingMissionService.startMission(authentication.getName(), id);
    }

    @PostMapping("/missions/{id}/complete")
    public HealingMissionCompleteResponseDto completeMission(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody(required = false) HealingMissionCompleteRequestDto request
    ) {
        return healingMissionService.completeMission(authentication.getName(), id, request);
    }

    // NEW
    @PostMapping("/missions/{id}/fail")
    public HealingMissionResponseDto failMission(Authentication authentication, @PathVariable Long id) {
        return healingMissionService.failMission(authentication.getName(), id);
    }

    @PostMapping("/missions/{id}/skip")
    public HealingMissionResponseDto skipMission(Authentication authentication, @PathVariable Long id) {
        return healingMissionService.skipMission(authentication.getName(), id);
    }

    @GetMapping("/history")
    public List<HealingMissionResponseDto> getHistory(Authentication authentication) {
        return healingMissionService.getHistory(authentication.getName());
    }

    @GetMapping("/stats")
    public HealingStatsResponseDto getStats(Authentication authentication) {
        return healingMissionService.getStats(authentication.getName());
    }

    @GetMapping("/badges")
    public List<HealingBadgeResponseDto> getAllBadges(Authentication authentication) {
        return healingMissionService.getAllBadges(authentication.getName());
    }

    @GetMapping("/badges/my")
    public List<HealingBadgeResponseDto> getMyBadges(Authentication authentication) {
        return healingMissionService.getMyBadges(authentication.getName());
    }

    @GetMapping("/missions/{id}/voice-config")
    public VoiceMissionConfigResponseDto getVoiceMissionConfig(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return voiceComfortEvaluationService.getVoiceMissionConfig(authentication.getName(), id);
    }

    @PostMapping(value = "/missions/{id}/voice-evaluate", consumes = {"multipart/form-data"})
    public VoiceEvaluationResponseDto evaluateVoiceMission(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam("audio") MultipartFile audio
    ) {
        return voiceComfortEvaluationService.evaluateVoiceMission(authentication.getName(), id, audio);
    }
}