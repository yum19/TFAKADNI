package tn.esprit.backend.module6a.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrowthStoryResponseDTO {

    private Long babyId;

    private String level; // NO_DATA / INITIAL / STABLE / POSITIVE / ATTENTION

    private LocalDate latestRecordDate;
    private Double latestWeight;
    private Double latestHeight;
    private Double latestHeadCircumference;
    private Double latestBmi;

    private Double weightDifference;
    private Double heightDifference;
    private Double headCircumferenceDifference;
    private Double bmiDifference;

    private String title;
    private String story;
    private String recommendation;
}