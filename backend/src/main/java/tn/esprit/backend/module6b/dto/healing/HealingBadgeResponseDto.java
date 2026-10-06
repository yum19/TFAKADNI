package tn.esprit.backend.module6b.dto.healing;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealingBadgeResponseDto {
    private Long id;
    private String name;
    private String description;
    private String icon;
    private String badgeType;
    private String earnedAt;
    private Boolean earned;
}