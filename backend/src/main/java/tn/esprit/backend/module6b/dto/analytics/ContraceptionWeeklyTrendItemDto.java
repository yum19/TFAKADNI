package tn.esprit.backend.module6b.dto.analytics;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContraceptionWeeklyTrendItemDto {
    private String weekLabel;
    private long recommendationsCount;
}