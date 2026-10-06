package tn.esprit.backend.module6b.dto.analytics;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContraceptionBreastfeedingStatsDto {
    private long breastfeedingYes;
    private long breastfeedingNo;
}