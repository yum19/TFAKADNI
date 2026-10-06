package tn.esprit.backend.dto.shared;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PregnancySummaryDto {
    private Long id;
    private Integer currentWeek;
    private String status;
    private String pregnancyType;
    private Boolean isSharedPartner;
}

