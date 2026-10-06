package tn.esprit.backend.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MarraineDTO {
    private Long userId;
    private String fullName;
    private String city;
    private Integer currentWeek;
    private String pregnancyType;
    private Double compatibilityScore;
    private String reason;
    private Boolean hasBaby;   // ← NEW
}