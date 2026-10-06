package tn.esprit.backend.module6b.dto.healing;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealingDashboardResponseDto {
    private List<HealingMissionResponseDto> todaysMissions;
    private List<HealingMissionResponseDto> recentHistory;
    private List<HealingBadgeResponseDto> latestBadges;
    private HealingStatsResponseDto stats;
}